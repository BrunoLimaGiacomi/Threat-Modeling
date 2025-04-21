# Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
# Licensed under the Amazon Software License  http://aws.amazon.com/asl/

import os

from aws_cdk import (
    CfnOutput,
    Duration,
    Stack,
    aws_appsync as appsync,
    aws_cognito as cognito,
    aws_events as events,
    aws_events_targets as targets,
    aws_iam as iam,
    aws_lambda as lambda_,
    aws_lambda_python_alpha as lambda_py,
    aws_logs as logs,
    aws_s3 as s3,
)

from constructs import Construct

from backend.api.generate_threats_workflow import GenerateThreatsWorkflow
from backend.api.database import Database

from cdk_aws_lambda_powertools_layer import LambdaPowertoolsLayer

from cdk_nag import NagPackSuppression, NagSuppressions

from pace_constructs import PACEBucket


class GraphQLAPI(Construct):
    def __init__(self, scope: Construct, construct_id: str, user_pool: cognito.IUserPool) -> None:
        super().__init__(scope, construct_id)

        bedrock_xacct_role = self.node.try_get_context("BEDROCK_XACCT_ROLE")

        self.logs_bucket = PACEBucket(self, "LogsBucket",
                                      lifecycle_rules=[],
                                      server_access_logs_prefix=None)

        self.data_bucket = PACEBucket(self, "DataBucket",
                                      lifecycle_rules=[],
                                      cors=[s3.CorsRule(
                                          allowed_methods=[
                                              s3.HttpMethods.GET,
                                              s3.HttpMethods.HEAD,
                                              s3.HttpMethods.DELETE,
                                              s3.HttpMethods.PUT,
                                              s3.HttpMethods.POST,
                                          ],
                                          allowed_origins=["*"],
                                          allowed_headers=["*"],
                                          exposed_headers=[
                                              "ETag",
                                          ],
                                          max_age=3000,
                                      )],
                                      server_access_logs_prefix='data_bucket_logs/',
                                      server_access_logs_bucket=self.logs_bucket
                                      )

        db = Database(self, "Database")

        auth_config = appsync.AuthorizationConfig(
            default_authorization=appsync.AuthorizationMode(authorization_type=appsync.AuthorizationType.USER_POOL,
                                                            user_pool_config=appsync.UserPoolConfig(
                                                                user_pool=user_pool)),
            additional_authorization_modes=[
                appsync.AuthorizationMode(authorization_type=appsync.AuthorizationType.IAM)
            ]
        )

        graphql_api = appsync.GraphqlApi(
            self, construct_id + "API",
            name=construct_id + "API",
            definition=appsync.Definition.from_file(
                os.path.join(os.path.dirname(__file__), "schema.graphql")),
            authorization_config=auth_config,
            xray_enabled=True,

            log_config=appsync.LogConfig(
                field_log_level=appsync.FieldLogLevel.ALL,  # TODO: remember to switch to something less verbose in prod
                retention=logs.RetentionDays.THREE_MONTHS,  # TODO: choose something that fits your auditing needs
            )
        )

        powertools_layer = LambdaPowertoolsLayer(self, "PowertoolsLayer", include_extras=True)

        genai_core_layer = lambda_py.PythonLayerVersion(
            self, "GenaiCoreLayer",
            entry="backend/genai_core",
            compatible_runtimes=[lambda_.Runtime.PYTHON_3_12, lambda_.Runtime.PYTHON_3_11],
            layer_version_name="GenAICoreLayer"
        )

        shared_layer = lambda_py.PythonLayerVersion(
            self, "SharedLayer",
            entry="backend/api/shared",
            compatible_runtimes=[lambda_.Runtime.PYTHON_3_12, lambda_.Runtime.PYTHON_3_11],
            layer_version_name="SharedLayer"
        )

        bus = events.EventBus(
            self, "GraphQL",
            event_bus_name="threat-model-events",
            # kms_key  # TODO: encrypt this bus
        )

        generate_all_threats = GenerateThreatsWorkflow(self, "GenerateAllThreats", graphql_api,
                                                       data_bucket=self.data_bucket,
                                                       db=db, event_bus=bus,
                                                       layers=[powertools_layer, shared_layer, genai_core_layer])

        resolver_function = lambda_py.PythonFunction(
            self, "ResolverFn",
            runtime=lambda_.Runtime.PYTHON_3_12,
            entry=os.path.join(os.path.dirname(__file__), "resolvers/main"),
            handler="lambda_handler",
            environment={
                "GRAPHQL_URL": graphql_api.graphql_url,
                "POWERTOOLS_SERVICE_NAME": "graphql_main",
                "POWERTOOLS_LOG_LEVEL": "INFO",
                "POWERTOOLS_METRICS_NAMESPACE": "ThreatModel",
                "DATA_BUCKET_NAME": self.data_bucket.bucket_name,

                **db.table_names(),
            },
            memory_size=2048,
            timeout=Duration.minutes(2),
            layers=[powertools_layer, shared_layer, genai_core_layer]
        )

        if bedrock_xacct_role:
            resolver_function.add_environment(key="BEDROCK_XACCT_ROLE", value=bedrock_xacct_role)
            resolver_function.add_to_role_policy(iam.PolicyStatement(
                actions=["sts:AssumeRole"],
                effect=iam.Effect.ALLOW,
                resources=[bedrock_xacct_role],
            ))

        resolver_function.add_to_role_policy(iam.PolicyStatement(
            actions=["bedrock:InvokeModel"],
            effect=iam.Effect.ALLOW,
            resources=[
                f"arn:aws:bedrock:us-east-1::foundation-model/{model_id}"
                for model_id in ["anthropic.claude-3-haiku-20240307-v1:0",
                                 "anthropic.claude-3-5-sonnet-20240620-v1:0",
                                 "anthropic.claude-3-sonnet-20240229-v1:0"]
            ]
        ))

        self.data_bucket.grant_read(resolver_function)
        db.grant_read_write_data(resolver_function)

        datasource = graphql_api.add_event_bridge_data_source("GraphQLDataSource", bus)
        bus.grant_put_events_to(datasource.grant_principal)

        eb_response_mapping_template = appsync.MappingTemplate.from_string(
            '#if($ctx.error)$utilerror($ctx.error.message, $ctx.error.type, $ctx.result) #end $util.toJson($ctx.result)')

        for field_name in ["createDiagramDescription", "extractComponents", "generateThreats"]:
            datasource.create_resolver(
                field_name.title() + "Resolver",
                type_name="Mutation",
                field_name=field_name,
                request_mapping_template=appsync.MappingTemplate.from_string(f"""{{
    "version": "2018-05-29",
    "operation": "PutEvents",
    "events": [{{
        "source": "threat-model",
        "detail": $util.toJson($context),
        "detailType": "{field_name}"
    }}]
}}"""),
                response_mapping_template=eb_response_mapping_template,
            )

        events.Rule(
            self, "CreateDiagramDescriptionRule",
            event_bus=bus,
            event_pattern=events.EventPattern(source=["threat-model"],
                                              detail_type=["createDiagramDescription", "extractComponents"]),
            targets=[targets.LambdaFunction(resolver_function,
                                            event=events.RuleTargetInput.from_event_path("$.detail"))],
        )

        events.Rule(
            self, "GenerateThreatsRule",
            event_bus=bus,
            event_pattern=events.EventPattern(source=["threat-model"], detail_type=["generateThreats"]),
            targets=[targets.SfnStateMachine(generate_all_threats.state_machine,
                                             input=events.RuleTargetInput.from_event_path(
                                                 "$.detail.arguments.generateThreatsInput"))],
        )

        events.Rule(
            self, "NotifyAllThreatsGenerated",
            event_bus=bus,
            event_pattern=events.EventPattern(source=["threat-model"], detail_type=["allThreatsGenerated"]),
            targets=[
                targets.AppSync(
                    graphql_api,
                    graph_ql_operation="mutation NotifyAllThreatsGenerated($id: ID!){ allThreatsGenerated(id: $id) { id } }",
                    variables=events.RuleTargetInput.from_object({
                        "id": events.EventField.from_path("$.detail.id")
                    })
                )
            ]
        )

        # the datasource and resolver below are used to relay back subscription updates
        subscriptions_datasource = graphql_api.add_none_data_source("GraphQLSubscriptionsDataSource",
                                                                    description="Source for subscription creation updates")

        for field_name in ["diagramDescription", "components", "threats", "allThreatsGenerated"]:
            graphql_api.grant(resolver_function,
                              appsync.IamResource.custom(f"types/Mutation/fields/{field_name}"),
                              "appsync:GraphQL")

            subscriptions_datasource.create_resolver(
                field_name.title() + "Resolver",
                type_name="Mutation", field_name=field_name,
                request_mapping_template=appsync.MappingTemplate.from_string(
                    '{ "version": "2017-02-28", "payload": $util.toJson($context.args) }'),
                response_mapping_template=appsync.MappingTemplate.from_string('$util.toJson($context.result)')
            )

        sync_datasource = graphql_api.add_lambda_data_source("GraphQLSyncDataSource", lambda_function=resolver_function)

        sync_datasource.create_resolver("ListDiagramResolver", type_name="Query", field_name="listDiagrams")
        sync_datasource.create_resolver("GetDiagramResolver", type_name="Query", field_name="getDiagram")

        sync_datasource.create_resolver("CreateComponentResolver", type_name="Mutation", field_name="createComponent")

        sync_datasource.create_resolver("UpdateComponentResolver", type_name="Mutation", field_name="updateComponent")
        sync_datasource.create_resolver("UpdateThreatResolver", type_name="Mutation", field_name="updateThreat")

        sync_datasource.create_resolver("DeleteComponentResolver", type_name="Mutation", field_name="deleteComponent")
        sync_datasource.create_resolver("DeleteThreatResolver", type_name="Mutation", field_name="deleteThreat")

        sync_datasource.create_resolver("GenerateReportResolver", type_name="Mutation", field_name="generateReport")

        # Outputs
        CfnOutput(self, "GraphQLEndpoint", value=graphql_api.graphql_url,
                  description="GraphQL Endpoint URL, use it when deploying the frontend", export_name="GraphQLEndpoint")

        NagSuppressions.add_resource_suppressions(
            graphql_api,
            suppressions=[
                NagPackSuppression(id="AwsSolutions-IAM4",
                                   reason="The logging configuration from cdk uses AWS managed policies we deem acceptable for prototype use. Consider using customer managed policies as you move to production.",
                                   applies_to=[
                                       "Policy::arn:<AWS::Partition>:iam::aws:policy/service-role/AWSAppSyncPushToCloudWatchLogs"]),
                NagPackSuppression(id="AwsSolutions-IAM5",
                                   reason="The events-to-appsync integration which allows event bridge to make a mutation can call any mutation. You should reevaluate in production if you must use a custom Role with granular permissions.",
                                   applies_to=[
                                       "Resource::arn:<AWS::Partition>:appsync:<AWS::Region>:<AWS::AccountId>:apis/<ThreatModelThreatModelAPI5212D7EC.ApiId>/types/Mutation/*"])
            ],
            apply_to_children=True,
        )

        NagSuppressions.add_resource_suppressions_by_path(
            stack=Stack.of(self),
            path="/BackendStack/LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8a/ServiceRole/Resource",
            suppressions=[
                NagPackSuppression(id="AwsSolutions-IAM4",
                                   reason="The logging configuration from cdk uses AWS managed policies we deem acceptable for prototype use. Consider using customer managed policies as you move to production.",
                                   applies_to=[
                                       "Policy::arn:<AWS::Partition>:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"]),
            ]
        )

        NagSuppressions.add_resource_suppressions_by_path(
            stack=Stack.of(self),
            path="/BackendStack/LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8a/ServiceRole/DefaultPolicy/Resource",
            suppressions=[
                NagPackSuppression(id="AwsSolutions-IAM5",
                                   reason="The service role created when using log_config for the GraphQL API uses * in some resources for convenience.")
            ]
        )

        NagSuppressions.add_resource_suppressions(
            sync_datasource,
            suppressions=[
                NagPackSuppression(id="AwsSolutions-IAM5",
                                   reason="GraphQL datasource must be able to call all aliases of lambda function, thus the star",
                                   applies_to=["Resource::<ThreatModelResolverFnA2EE3E9E.Arn>:*"])
            ],
            apply_to_children=True,
        )

        NagSuppressions.add_resource_suppressions(
            resolver_function,
            suppressions=[
                NagPackSuppression(id="AwsSolutions-IAM4",
                                   reason="For prototyping we use the AWS managed AWSLambdaBasicExecutionRole which uses AWS managed policies.",
                                   applies_to=[
                                       "Policy::arn:<AWS::Partition>:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"]),
                NagPackSuppression(id="AwsSolutions-IAM5",
                                   reason="CDK uses star in some actions for convenience. This fn must be able to read any object in the data bucket",
                                   applies_to=[
                                       "Action::s3:GetBucket*",
                                       "Action::s3:GetObject*",
                                       "Action::s3:List*",
                                       "Resource::<ThreatModelDataBucketD3863F79.Arn>/*",
                                       "Resource::<ThreatModelThreatModelsTableF1D3D29B.Arn>/index/*",
                                       "Resource::<ThreatModelDatabaseComponentsB5563436.Arn>/index/*",
                                       "Resource::<ThreatModelDatabaseDiagrams2F00824D.Arn>/index/*",
                                       "Resource::<ThreatModelDatabaseThreats1E5E17C7.Arn>/index/*",
                                   ])
            ],
            apply_to_children=True,
        )
