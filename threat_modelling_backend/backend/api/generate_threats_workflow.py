# Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
# Licensed under the Amazon Software License  http://aws.amazon.com/asl/

import os

from aws_cdk import (
    CfnOutput,
    Duration,
    Names,
    RemovalPolicy,
    aws_appsync as appsync,
    aws_dynamodb as dynamodb,
    aws_events as events,
    aws_iam as iam,
    aws_lambda as lambda_,
    aws_lambda_python_alpha as lambda_py,
    aws_logs as logs,
    aws_s3 as s3,
    aws_stepfunctions as sfn,
    aws_stepfunctions_tasks as tasks,
)

from constructs import Construct

from cdk_nag import NagSuppressions, NagPackSuppression

from backend.api.database import Database


class GenerateThreatsWorkflow(Construct):
    def __init__(self, scope: Construct, construct_id: str, graphql_api: appsync.GraphqlApi, data_bucket: s3.IBucket,
                 db: Database, event_bus: events.IEventBus, layers, **kwargs) -> None:
        super().__init__(scope, construct_id)

        bedrock_xacct_role = self.node.try_get_context("BEDROCK_XACCT_ROLE")

        generate_threats_function = lambda_py.PythonFunction(
            self, "GenerateThreatsFn",
            runtime=lambda_.Runtime.PYTHON_3_12,
            entry=os.path.join(os.path.dirname(__file__), "workflows/generate_threats"),
            handler="lambda_handler",
            environment={
                "GRAPHQL_URL": graphql_api.graphql_url,
                "POWERTOOLS_SERVICE_NAME": "generate_threats",
                "POWERTOOLS_LOG_LEVEL": "INFO",
                "POWERTOOLS_METRICS_NAMESPACE": "ThreatModel",
                "DATA_BUCKET_NAME": data_bucket.bucket_name,

                **db.table_names(),
            },
            memory_size=2048,
            timeout=Duration.minutes(2),  # generation of threats takes 2min on p90
            layers=layers
        )

        db.grant_read_write_data(generate_threats_function)

        if bedrock_xacct_role:
            generate_threats_function.add_environment(key="BEDROCK_XACCT_ROLE", value=bedrock_xacct_role)
            generate_threats_function.add_to_role_policy(iam.PolicyStatement(
                actions=["sts:AssumeRole"],
                effect=iam.Effect.ALLOW,
                resources=[bedrock_xacct_role],
            ))

        generate_threats_function.add_to_role_policy(iam.PolicyStatement(
            actions=["bedrock:InvokeModel"],
            effect=iam.Effect.ALLOW,
            resources=[
                f"arn:aws:bedrock:us-east-1::foundation-model/{model_id}"
                for model_id in ["anthropic.claude-3-haiku-20240307-v1:0",
                                 "anthropic.claude-3-5-sonnet-20240620-v1:0",
                                 "anthropic.claude-3-sonnet-20240229-v1:0"]
            ]
        ))

        data_bucket.grant_read_write(generate_threats_function)

        graphql_api.grant(generate_threats_function,
                          appsync.IamResource.custom("types/Mutation/fields/threats"),
                          "appsync:GraphQL")

        def _update_status_to(status: str):
            return tasks.DynamoUpdateItem(
                self, f"Update Status to {status}",
                key={
                    "id": tasks.DynamoAttributeValue.from_string(sfn.JsonPath.string_at("$.id"))
                },
                table=db.diagrams_table,
                expression_attribute_names={"#current_status": "status"},
                expression_attribute_values={":current_status": tasks.DynamoAttributeValue.from_string(status)},
                update_expression="SET #current_status = :current_status",
                result_path=sfn.JsonPath.DISCARD
            )

        update_status_to_generating = _update_status_to("GENERATING_THREATS")
        update_status_to_generated = _update_status_to("THREATS_GENERATED")

        """
        We will do a cross-product of components and threat types. This means that if we have as input 3 components,
        and 6 threat types, it will result in 3x6=18 invocations to our generate threats task
        """

        collect_all_tasks_function = lambda_.Function(
            self, "CollectAllTasksFn",
            runtime=lambda_.Runtime.NODEJS_20_X,
            handler="index.handler",
            code=lambda_.Code.from_inline(
                "exports.handler = function(ev, ctx, cb) { "
                "console.log(ev); "
                "const DEFAULT_THREAT_TYPES = ['Spoofing', 'Tampering', 'Repudiation', 'InformationDisclosure', 'DenialOfService', 'ElevationOfPrivileges']; "
                "const { id, s3Prefix, diagramDescription } = ev; "
                "const components = ev.components || []; "
                "const threatTypes = ev.threatTypes.length == 0 ? DEFAULT_THREAT_TYPES : ev.threatTypes; "
                " const tasks = components.flatMap(component => threatTypes.map(threatType => ({ component, threatType }))); "
                "cb(null, { id, s3Prefix, diagramDescription, tasks })"
                "}")
        )

        collect_all_tasks = tasks.LambdaInvoke(self, "CollectAllTasks", lambda_function=collect_all_tasks_function,
                                               payload_response_only=True)
        generate_threats = tasks.LambdaInvoke(self, "GenerateThreats", lambda_function=generate_threats_function)
        generate_threats.add_retry(max_attempts=10, interval=Duration.seconds(90))

        map_all_threats = sfn.Map(
            self, "Generate all threats",
            max_concurrency=5,
            items_path="$.tasks",
            item_selector={
                "id": sfn.JsonPath.string_at('$.id'),
                "s3Prefix": sfn.JsonPath.string_at('$.s3Prefix'),
                "diagramDescription": sfn.JsonPath.string_at('$.diagramDescription'),
                "threatType": sfn.JsonPath.string_at('$$.Map.Item.Value.threatType'),
                "component": sfn.JsonPath.object_at('$$.Map.Item.Value.component'),
            },
            result_path=sfn.JsonPath.DISCARD,
        ).item_processor(generate_threats)

        notify_completed = tasks.EventBridgePutEvents(self, "Notify completed",
                                                      entries=[tasks.EventBridgePutEventsEntry(
                                                          detail=sfn.TaskInput.from_json_path_at("$"),
                                                          event_bus=event_bus,
                                                          detail_type="allThreatsGenerated",
                                                          source="threat-model",
                                                      )])

        workflow_logs = logs.LogGroup(self, "GenerateThreadsWorkflowLogs",
                                      log_group_name="/threatmodel/" + Names.unique_resource_name(self),
                                      retention=logs.RetentionDays.THREE_MONTHS,
                                      removal_policy=RemovalPolicy.DESTROY,
                                      )

        self.state_machine = sfn.StateMachine(
            self, "GenerateThreatsWorkflow",
            definition=update_status_to_generating.next(collect_all_tasks).next(map_all_threats).next(
                update_status_to_generated).next(notify_completed),
            logs=sfn.LogOptions(
                destination=workflow_logs,
                level=sfn.LogLevel.ALL
            ),
        )

        CfnOutput(self, "DataBucketName", value=data_bucket.bucket_name, description="Data bucket name",
                  export_name="DataBucketName")

        for fn in [collect_all_tasks_function, generate_threats_function]:
            NagSuppressions.add_resource_suppressions(
                fn,
                suppressions=[
                    NagPackSuppression(
                        id="AwsSolutions-IAM4",
                        reason="For prototyping we use the AWS managed AWSLambdaBasicExecutionRole which uses AWS managed policies.",
                        applies_to=[
                            "Policy::arn:<AWS::Partition>:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
                        ]
                    ),
                    NagPackSuppression(id="AwsSolutions-IAM5",
                                       reason="This Lambda should be able to query all table indices (GSIs).",
                                       applies_to=[
                                           "Resource::<ThreatModelThreatModelsTableF1D3D29B.Arn>/index/*",
                                           "Resource::<ThreatModelDatabaseComponentsB5563436.Arn>/index/*",
                                           "Resource::<ThreatModelDatabaseDiagrams2F00824D.Arn>/index/*",
                                           "Resource::<ThreatModelDatabaseThreats1E5E17C7.Arn>/index/*",
                                       ]),
                    NagPackSuppression(id="AwsSolutions-IAM5",
                                       reason="CDK uses stars in actions for S3 for convenience.",
                                       applies_to=[
                                           "Action::s3:Abort*",
                                           "Action::s3:DeleteObject*",
                                           "Action::s3:GetBucket*",
                                           "Action::s3:GetObject*",
                                           "Action::s3:List*",
                                       ]),
                    NagPackSuppression(id="AwsSolutions-IAM5",
                                       reason="This lambda function should be able to access all files in bucket. When you move to production, consider scoping this down.",
                                       applies_to=[
                                           "Resource::<ThreatModelDataBucketD3863F79.Arn>/*",
                                       ]),
                ],
                apply_to_children=True
            )

        NagSuppressions.add_resource_suppressions(
            self.state_machine,
            suppressions=[
                NagPackSuppression(id="AwsSolutions-IAM5", reason="This workflow should be able to invoke all versions of these lambda functions.",
                                   applies_to=[
                                       "Resource::<ThreatModelGenerateAllThreatsCollectAllTasksFn9632F510.Arn>:*",
                                       "Resource::<ThreatModelGenerateAllThreatsGenerateThreatsFn5EC6CCAF.Arn>:*",
                                   ]),
                NagPackSuppression(id="AwsSolutions-IAM5",
                                   reason="This workflow uses a logging policy with a resource:*. If this is against your security policy we recommend creating a role manually and not using the default one.",
                                   applies_to=[
                                       "Resource::*",
                                   ]),
                NagPackSuppression(id="AwsSolutions-SF2",
                                   reason="We intentionally choose not to have tracing enabled during prototyping. We recommend you reevaluate this when you move to production.")
            ],
            apply_to_children=True
        )
