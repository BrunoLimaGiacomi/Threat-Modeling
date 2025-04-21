# Unified Step-by-Step Guide for GenAI Threat Modeling Platform on AWS

This document provides comprehensive instructions for deploying and managing a complete GenAI-based Threat Modeling solution (Frontend and Backend) on AWS.

## 1. Prerequisites

Ensure you have installed and configured the following tools:

AWS CLI (https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html)

AWS CDK (https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html)

Docker (https://docs.docker.com/engine/install/)

Node.js >= 18.x.x https://github.com/nodesource/distributions

Python 3.11+

git

Set up AWS credentials:

    "aws configure"

## 2. Deploying the Backend Stack

Step-by-Step:

### A. Set Up the EC2 Deployment Environment (Recommended)

Launch an EC2 instance (t3.micro or t3.small).

Attach an IAM role with permissions for AWS services (CDK, S3, ECR, CloudFormation).

Update repositories and install dependencies:

    "sudo apt-get update"
    "sudo apt-get install python3.11 python3.11-venv python3-pip git"

### B. Clone the Backend Repository:

    "git clone <your_backend_repo>"
    "cd backend"

### C. Create a Python Virtual Environment:

    "python3.11 -m venv .venv"
    "source .venv/bin/activate"
    "pip install -r requirements.txt"

### D. AWS CDK Bootstrap:

Bootstrap your AWS account (first-time only):

    "cdk bootstrap aws://<YOUR_ACCOUNT_ID>/<REGION>"

### D. Deploy the Backend Stack:

    "cdk deploy --all --require-approval=never"

*Optional: Cross-account Amazon Bedrock access:*

    "cdk deploy --all --require-approval=never --context BEDROCK_XACCT_ROLE=arn:aws:iam::XXX:role/YOUR_XACCT_ROLE"

### E. Upload Sample Files:

Create directories and upload example architecture diagrams:

    "aws s3 cp samples/example_architecture.png s3://<DataBucketName>/genai_core_examples/diagram_describer/"
    "aws s3 cp samples/example_architecture.png.description s3://<DataBucketName>/genai_core_examples/diagram_describer/"

Ensure filenames follow the convention:

    "my_arch.png"
    "my_arch.png.description"

### E. Take Note of Backend Stack Outputs:

From AWS CloudFormation console, note:

                                    ThreatModelGenerateDataBucketName

                                    ThreatModelGraphQLEndpoint

                                    UserPoolId, IdentityPoolId

## 3. Deploying the Frontend Stack

Step-by-Step:

### A. Clone the Frontend Repository:

    "git clone <your_frontend_repo>"
    "cd frontend"

### B. Configure the Frontend Environment:

Create the .env file inside the webapp/ directory:

VITE_APP_NAME="Threat Modeling Platform"
VITE_AWS_REGION="<Your AWS Region>"
VITE_AUTH_MODE="userPool"
VITE_COGNITO_USER_POOL_ID="<UserPoolId>"
VITE_COGNITO_USER_POOL_CLIENT_ID="<AppClientId>"
VITE_COGNITO_IDENTITY_POOL_ID="<IdentityPoolId>"
VITE_AWS_REGION="<Region>"
VITE_AUTH_MODE="userPool"
VITE_APP_NAME="Threat Modeling Platform"
VITE_GRAPHQL_ENDPOINT="<GraphQLEndpoint>"

*Important: Replace placeholders using outputs from the backend stack deployed in CloudFormation.*

### C. Install Dependencies:

Inside the webapp directory:

    "npm install"

### D. Create Cognito Users:

Log into the AWS Cognito Console.

Select your User Pool and create necessary users to log in to the frontend.

### E. Deploy Frontend Stack with CDK:

At the root of the frontend directory:

    "cdk deploy --require-approval=never"

This builds the React app and deploys it using Amazon S3, CloudFront, and AWS WAF for security.

## 4. Development and Local Testing

Frontend Development:

Navigate to the webapp directory.

    "npm run dev"

Access: http://localhost:5173/

Backend Testing:

Run unit tests from the backend root directory:

    "PYTHONPATH="backend/api/resolvers/main:backend/genai_core:backend/api/shared" pytest tests/unit"

## 5. Updating GraphQL Schema and Types (Frontend Integration):

From the webapp directory:

    "npx @aws-amplify/cli codegen types --apiId <GraphQL_API_ID> --region <Region>"
    "npx @aws-amplify/cli codegen"

## 6. Security Considerations

Your deployment includes security controls:

AWS WAF (for frontend protection via CloudFront)

IAM roles and policies strictly scoped to necessary actions.

AWS Cognito manages user authentication securely.

Secure API endpoints via AWS AppSync.

Ensure IAM roles and permissions are configured following least privilege principles.

## 7. Customizing Prompts for Threat Modeling

Backend prompts are customizable in the following path:

    "backend/genai_core"

Adjust the prompts according to your threat-modeling needs.

## 8. Troubleshooting

Verify your IAM identity:

    "aws sts get-caller-identity"

Verify CloudFormation stack deployment statuses in the AWS console.

Confirm EC2 IAM roles if deploying from an EC2 instance.

