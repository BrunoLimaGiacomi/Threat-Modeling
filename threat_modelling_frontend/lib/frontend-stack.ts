// Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.]
// SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
// Licensed under the Amazon Software License  http://aws.amazon.com/asl/

import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as waf from "aws-cdk-lib/aws-wafv2";
import { Construct } from "constructs";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { NagSuppressions } from "cdk-nag";

const { execSync } = require("child_process");
const path = require("node:path");

export class FrontendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create an S3 bucket for static website hosting
    const webappBucket = new s3.Bucket(this, "WebappBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      enforceSSL: true,
    });

    const originAccessIdentity = new cloudfront.OriginAccessIdentity(
      this,
      "OriginAccessIdentity"
    );
    webappBucket.grantRead(originAccessIdentity);

    // Run build script
    let stdout = execSync("cd webapp && npm install && npm run build");
    console.log(stdout);

    // Move dist files to S3 bucket
    const deployment = new BucketDeployment(this, "DeployWebapp", {
      sources: [Source.asset(path.join(__dirname, "..", "webapp", "dist"))],
      destinationBucket: webappBucket,
    });

    const webAcl = new waf.CfnWebACL(this, "WebACL", {
      scope: "CLOUDFRONT",
      defaultAction: { allow: {} },
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: "CatchAll",
        sampledRequestsEnabled: true,
      },
      rules: [
        {
          name: "AWSManagedRules",
          priority: 0,
          statement: {
            managedRuleGroupStatement: {
              vendorName: "AWS",
              name: "AWSManagedRulesCommonRuleSet",
              excludedRules: [],
            },
          },
          overrideAction: { none: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: "PACEWebACL-AWSManagedRules",
          },
        },
      ],
    });

    // Create a CloudFront web distribution
    const distribution = new cloudfront.Distribution(this, "Distribution", {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(webappBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        originRequestPolicy: cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
      },
      defaultRootObject: "index.html",
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      geoRestriction: cloudfront.GeoRestriction.allowlist("BR", "MX", "CL"),
      webAclId: webAcl.attrArn,
    });

    // Output the CloudFront URL
    new cdk.CfnOutput(this, "DistributionDomainName", {
      value: distribution.distributionDomainName,
      description: "CloudFront Distribution Domain Name",
    });

    NagSuppressions.addResourceSuppressions(webappBucket, [
      {
        id: "AwsSolutions-S1",
        reason:
          "For prototyping purposes we chose not to log access to bucket. You should consider logging as you move to production.",
      },
    ]);

    NagSuppressions.addResourceSuppressions(deployment.handlerRole, [
      {
        id: "AwsSolutions-IAM4",
        reason:
          "The bucket deployment CDK construct uses a lambda function which uses AWSLambdaBasicExecutionRole managed policy",
        appliesTo: [
          "Policy::arn:<AWS::Partition>:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
        ],
      },
    ]);

    NagSuppressions.addResourceSuppressions(
      deployment.handlerRole,
      [
        {
          id: "AwsSolutions-IAM5",
          reason:
            "The bucket deployment CDK construct requires wildcard permissions for deploying assets to the bucket",
        },
      ],
      true
    );

    NagSuppressions.addResourceSuppressionsByPath(
      this,
      "/FrontendStack/Custom::CDKBucketDeployment8693BB64968944B69AAFB0CC9EB8756C/Resource",
      [
        {
          id: "AwsSolutions-L1",
          reason:
            "The bucket deployment CDK construct maintainers are responsible for updating non-container lambda runtimes",
        },
      ]
    );

    NagSuppressions.addResourceSuppressions(distribution, [
      {
        id: "AwsSolutions-CFR4",
        reason: "Amazon S3 doesn't support HTTPS for website endpoints",
      },
    ]);

    NagSuppressions.addResourceSuppressions(distribution, [
      {
        id: "AwsSolutions-CFR3",
        reason:
          "For prototyping purposes we chose not to log access to bucket. You should consider logging as you move to production.",
      },
    ]);
  }
}
