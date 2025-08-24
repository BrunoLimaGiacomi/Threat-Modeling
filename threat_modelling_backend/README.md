
# GenAI Threat Modelling

This is the backend for the Threat Modelling prototype created by AWS PACE LatAm.

Below you will find instructions for deploying this backend to your own AWS Account.

## Requirements

- Python 3.11 or higher
- git
- Docker - [instructions for installing](https://docs.docker.com/engine/install/)
- AWS CLI - [instructions for installing](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- AWS CDK - [instructions for installing](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html)

You will also need valid credentials to your AWS Account to be present in your terminal session.

## Getting started

Wwe recommend you create a virtualenv to manage project dependencies. If you are on MacOS or Linux:

```
$ python3 -m venv .venv
```

After the init process completes and the virtualenv is created, you can use the following
step to activate your virtualenv.

```
$ source .venv/bin/activate
```

If you are a Windows platform, you would activate the virtualenv like this:

```
% .venv\Scripts\activate.bat
```

Once the virtualenv is activated, you can install the required dependencies.

```
$ pip install -r requirements.txt
```

Before synthesizing the CloudFormation templates, you may need to login 

```
aws ecr-public get-login-password --region us-east-1 | docker login --username AWS --password-stdin public.ecr.aws
```

At this point you can now synthesize the CloudFormation template for this project.

```
$ cdk synth
```

## Deploy to AWS Account

Confirm you have valid credentials to the correct AWS account by running the following CLI command:

```
aws sts get-caller-identity
```

Make sure the output shows the identity you expect for the Account that will get the deployment.

Deploying to your AWS Account require that you first bootstrap your Account. This is a one-time only process, so if you
have previously bootstrapped your account, you may skip this step.

```
cdk bootstrap 
```

Once you are bootstrapped you can deploy. Deploying is as simple as running the command below.

```
cdk deploy --all --require-approval=never
```

If you need to access Amazon Bedrock cross-account, you can optionally provide the ARN to an IAM Role that our Lambda 
functions will assume before invoking Bedrock APIs:

```
cdk deploy --all --require-approval=never --context BEDROCK_XACCT_ROLE=arn:aws:iam::XXX:role/YOUR_XACCT_ROLE
```

After deployment is completed you should see some output values that are required by the Frontend. Make note of them
before you begin deploying the Frontend.

Example outputs:

```
BackendStack.ThreatModelGenerateAllThreatsDataBucketNameDBF1C04D = backendstack-threatmodeldatabucketdxxxx-yyy
BackendStack.ThreatModelGraphQLEndpointA93404B8 = https://abc123.appsync-api.us-east-1.amazonaws.com/graphql
BackendStack.ThreatModelUserPoolIdentityPoolId106951F9 = us-east-1:xxx-yyy-zzz-...
BackendStack.ThreatModelUserPoolUserPoolClientIdB9EE2A87 = 123abc...
BackendStack.ThreatModelUserPoolUserPoolId9919005E = us-east-xyz...
```

*ATTENTION:* Do not forget to enable model access before attempting to use the application.

## Configure Examples for Diagram Describer

Part of the process of extracting threats involves describing your architectural diagrams as a Data Flow Diagram (DFD).

In order to understand the way you create your diagrams, the `Diagram Describer` process uses the Few Shot prompting 
technique, which requires you to provide one or more examples.

As a sample, we offer the architectural diagram of this prototype along with its description as a DFD. Feel free to use
it or even better, to create your own examples.

You should upload the pairs of diagram + description to a specific location in the data bucket. It is paramount that each pair has the same name with only the extensions changing.

Good:

```
my_arch.png
my_arch.png.description
```

Bad:

```
myarch.png
my_arch_description.txt
```

Here is how you could, for example, upload the provided samples.

```bash
aws s3 cp samples/example_architecture.png s3://$(aws cloudformation describe-stacks --stack-name BackendStack --query "Stacks[0].Outputs[?ExportName=='DataBucketName'].OutputValue" --output text)/genai_core_examples/diagram_describer/
aws s3 cp samples/example_architecture.png.description s3://$(aws cloudformation describe-stacks --stack-name BackendStack --query "Stacks[0].Outputs[?ExportName=='DataBucketName'].OutputValue" --output text)/genai_core_examples/diagram_describer/
```

**ATTENTION:** You must upload at least one pair of examples before running the application, otherwise the process will 
fail silently (no error message is displayed in the frontend).

## Developing

If you wish to make changes to this project, you can perform any code alterations and re-deploy the Backend stack.

If you wish to run tests, you may execute unit tests by running the command below from the root folder of this project:

```
PYTHONPATH="backend/api/resolvers/main:backend/genai_core:backend/api/shared" pytest tests/unit
```
