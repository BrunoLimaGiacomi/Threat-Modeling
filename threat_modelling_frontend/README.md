# Gen-AI Threat Modeling Platform

This repository contains a base web application. It uses [Vite](https://vitejs.dev/) + [React](https://react.dev/). To deploy you will run a basic CDK stack using [Amazon S3](https://aws.amazon.com/s3/) and [Amazon Cloudfront](https://aws.amazon.com/cloudfront/) with [AWS WAF](https://aws.amazon.com/waf/) for security.

## Requirements

In order to run and deploy this project, you need to have installed:

- AWS CLI. Refer to [Installing the AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html)
- AWS Credentials configured in your environment. Refer to
  [Configuration and credential file settings](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html)
- Node >= 18.x.x
- AWS CDK. Refer to [Getting started with the AWS CDK](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html)

You also need to have the proper backend stack for your prototype deployed into your account, as well as a valid user configured in [Amazon Cognito](https://aws.amazon.com/cognito/).

Make sure to deploy the frontend using the same configuration option as your backend.

---

## Developing and running locally

### Configuring your environment

In a terminal, run:

```shell
$ cd webapp/
```

Inside the `webapp/` folder, create a file named `.env`. Copy the environment displayed below and replace the property values with the outputs from your deployed backend stack.

```properties
VITE_APP_NAME="Threat Modeling Platform"
VITE_AWS_REGION="<REGION_NAME>"
VITE_AUTH_MODE="userPool"
VITE_COGNITO_USER_POOL_ID="<COGNITO_USER_POOL_ID>"
VITE_COGNITO_USER_POOL_CLIENT_ID="<COGNITO_USER_POOL_CLIENT_ID>"
VITE_COGNITO_IDENTITY_POOL_ID="<COGNITO_IDENTITY_POOL_ID>"
VITE_DATA_BUCKET_NAME="<S3_BUCKET_NAME>"
VITE_GRAPHQL_ENDPOINT="<APP_SYNC_ENDPOINT>"
```

### Developing with dev mode

From the `webapp/` folder, you can run the following command in a terminal to run the app in development mode:

```shell
$ npm i
$ npm run dev
```

Open [http://localhost:5173/](http://localhost:5173/) to view it in your browser.

The page will reload when you make changes. You may also see any lint errors in the console.

### Developing with watch and hot reloading

In one terminal window, run:

```shell
$ npm run watch
```

In another window, run:

```shell
$ npm run preview
```

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules. It builds the app for production to the `dist` folder. It correctly bundles React in production mode and optimizes the build for the best performance.

---

### Updating GraphQL statements and types

If you update the GraphQL schema in the backend, you will most likely need to update its
representation in the frontend app.

To do so simply run:

```
npx @aws-amplify/cli codegen statements --apiId <GRAPHQL_API_ID_FROM_BACKEND_DEPLOY> --region <REGION_YOU_DEPLOYED_BACKEND_TO>
npx @aws-amplify/cli codegen types --apiId <GRAPHQL_API_ID_FROM_BACKEND_DEPLOY> --region <REGION_YOU_DEPLOYED_BACKEND_TO>
```

For additional details on codegen, and how to use it with Amplify see
[Client code generation](https://docs.amplify.aws/gen1/react/tools/cli-legacy/client-codegen/#workflows) on Amplify
docs.

## Deploying the app

### Configure your environment

Make sure your webapp environment is configured by creating the `.env` file inside the `webapp/` folder.

The required properties are:

```properties
VITE_APP_NAME="Threat Modeling Platform"
VITE_AWS_REGION="<REGION_NAME>"
VITE_AUTH_MODE="userPool"
VITE_COGNITO_USER_POOL_ID="<COGNITO_USER_POOL_ID>"
VITE_COGNITO_USER_POOL_CLIENT_ID="<COGNITO_USER_POOL_CLIENT_ID>"
VITE_COGNITO_IDENTITY_POOL_ID="<COGNITO_IDENTITY_POOL_ID>"
VITE_DATA_BUCKET_NAME="<S3_BUCKET_NAME>"
VITE_GRAPHQL_ENDPOINT="<APP_SYNC_ENDPOINT>"
```

You can find the proper values for the environment in your backend stack deployment outputs on the CloudFormation console.

### Dependencies

Move to the root folder (`frontend/`).

Use either [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/getting-started/install) to install the required dependencies.

```
$ npm install
```

or

```
$ yarn
```

At this point you can now synthesize the CloudFormation template for this code.

```
$ cdk synth
```

This will simply generate and print to stout the CloudFormation Template describing the resources. If this succeeds you are ready to deploy.

### Deployment

You can deploy the application stack by running:

```shell
$ cdk deploy --require-approval=never
```

This command will build the Web Application under the `webapp/` folder and deploy it to an Amazon S3 bucket. The application is served via an Amazon Cloudfront distribution protected by a Amazon WAF WebAcl distribution. If you wish to change and redeploy your application, you can run multiple deployment commands.

The URL for your application will be printed to your terminal at the end of the process, but you can always check it again on the CloudFront's console.
