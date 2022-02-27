import { Construct } from "constructs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Stack, StackProps, CfnOutput } from "aws-cdk-lib";
import * as cdk from "aws-cdk-lib";
import * as appsync from "aws-cdk-lib/aws-appsync";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as dynamo from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as path from "path";
import * as fs from "fs";
import * as ssm from "aws-cdk-lib/aws-ssm";
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import { camelCase } from "camel-case";

const stackName = "AWS-CDK-Workstations-API";
const stackRegion = "US-EAST-2";

export class AwsCdkWorkstationsApiStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // const userPool = new cognito.UserPool(
    //   this,
    //   camelCase(`${stackName}-userpool`),
    //   {
    //     selfSignUpEnabled: true,
    //     accountRecovery: cognito.AccountRecovery.PHONE_AND_EMAIL,
    //     userVerification: {
    //       emailStyle: cognito.VerificationEmailStyle.CODE,
    //     },
    //     autoVerify: {
    //       email: true,
    //     },
    //     standardAttributes: {
    //       email: {
    //         required: true,
    //         mutable: false,
    //       },
    //       phoneNumber: {
    //         required: false,
    //         mutable: true,
    //       },
    //     },
    //     signInCaseSensitive: false,
    //     passwordPolicy: {
    //       minLength: 8,
    //       requireLowercase: true,
    //       requireDigits: true,
    //       requireSymbols: true,
    //       requireUppercase: true,
    //     },
    //   }
    // );

    // new CfnOutput(this, "UserPoolId", {
    //   value: userPool.userPoolId,
    // });

    // const userPoolClient = new cognito.UserPoolClient(
    //   this,
    //   camelCase(`${stackName}-userpool-client`),
    //   {
    //     userPool: userPool,
    //   }
    // );

    // new CfnOutput(this, "UserPoolClientId", {
    //   value: userPoolClient.userPoolClientId,
    // });

    const lambdaFunctionRole = new iam.Role(
      this,
      camelCase(`${stackName}-WorkstationInstance-Lambda-Role`),
      {
        assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      }
    );
    lambdaFunctionRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaBasicExecutionRole"
      )
    );
    lambdaFunctionRole.addToPolicy(
      new iam.PolicyStatement({
        resources: ["*"],
        actions: ["ec2:*", "dynamodb:*", "lambda:*", "logs:*", "cognito-idp:*"],
        effect: iam.Effect.ALLOW,
      })
    );

    // Create lambda for graphql
    const lambdaFunc = new NodejsFunction(
      this,
      camelCase(`${stackName}-WorkstationInstance-Lambda`),
      {
        entry: path.join(
          __dirname,
          "..",
          "appsync-lambdas",
          "WorkstationInstancesDataSource",
          "main.ts"
        ),
        handler: "handler",
        functionName: camelCase(
          `${stackName}-WorkstationInstance-Lambda-Function`
        ),
        runtime: lambda.Runtime.NODEJS_14_X,
        role: lambdaFunctionRole,
        timeout: cdk.Duration.minutes(5),
      }
    );

    // const shouldCreateTable = ssm.StringParameter.fromStringParameterAttributes(
    //   this,
    //   'ShouldCreateTable',
    //   {
    //     parameterName: `/AwsCdkWorkstationsApiStack/Config/ShouldCreateTable`
    //   }
    // ).stringValue

    // const shouldCreateTableCondition = new cdk.CfnCondition(
    //   this,
    //   'ShouldCreateBucketCondition',
    //   {
    //     expression: cdk.Fn.conditionEquals(shouldCreateTable, 'true')
    //   }
    // )

    // // Create db tables
    // const todoTable = new dynamo.Table(
    //   this,
    //   camelCase(`${stackName}-Todo-DB`),
    //   {
    //     tableName: camelCase(`${stackName}-Todos`),
    //     billingMode: dynamo.BillingMode.PAY_PER_REQUEST,
    //     partitionKey: {
    //       name: "id",
    //       type: dynamo.AttributeType.STRING,
    //     },
    //     // removalPolicy: RemovalPolicy.DESTROY,
    //   }
    // );
    // (todoTable.node.defaultChild as dynamo.CfnTable).cfnOptions.condition = shouldCreateTableCondition

    // const importedOrCreatedTable = dynamo.Table.fromTableAttributes(this, 'ImportedOrCreatedTable', {
    //   tableName: camelCase(`${stackName}-Todo-DB`),
    // })

    // Create Graphql
    const appsyncLoggingServiceRole = new iam.Role(
      this,
      camelCase(`${stackName}-logging-role`),
      {
        assumedBy: new iam.ServicePrincipal("appsync.amazonaws.com"),
      }
    );

    appsyncLoggingServiceRole.addToPolicy(
      new iam.PolicyStatement({
        resources: ["*"],
        actions: ["cloudwatch:*", "logs:*"],
        effect: iam.Effect.ALLOW,
      })
    );

    const graphqlApi = new appsync.CfnGraphQLApi(this, "Api", {
      name: camelCase(stackName),
      logConfig: {
        cloudWatchLogsRoleArn: appsyncLoggingServiceRole.roleArn,
        fieldLogLevel: "ALL",
      },
      authenticationType: "API_KEY",
      // additionalAuthenticationProviders: [
      //   {
      //     authenticationType: "AMAZON_COGNITO_USER_POOLS",
      //     userPoolConfig: {
      //       appIdClientRegex: userPoolClient.userPoolClientId,
      //       awsRegion: stackRegion,
      //       userPoolId: userPool.userPoolId,
      //     },
      //   },
      // ],
      xrayEnabled: true,
    });

    const graphApiKey = new appsync.CfnApiKey(
      this,
      camelCase(`${stackName}-KEY`),
      {
        apiId: graphqlApi.attrApiId,
      }
    );

    const definitionContent = fs
      .readFileSync(
        path.join(
          __dirname,
          "..",
          "graphql",
          "AWS-CDK-Workstations-API-Schema.graphql"
        )
      )
      .toString();
    const graphqlApiSchema = new appsync.CfnGraphQLSchema(
      this,
      camelCase(`${stackName}-Schema`),
      {
        apiId: graphqlApi.attrApiId,
        definition: definitionContent,
        // `
        //   schema {
        //     query: Query
        //   }

        //   type Query {
        //     getWorkstationInstance(id: ID!, name: String!): WorkstationInstance
        //     listWorkstationInstances(filter: TableWorkstationInstanceFilterInput, limit: Int, nextToken: String): WorkstationInstanceConnection
        //   }

        //   input TableWorkstationInstanceFilterInput {
        //     id: TableIDFilterInput
        //     name: TableStringFilterInput
        //     status: TableStringFilterInput
        //   }

        //   input TableStringFilterInput {
        //     ne: String
        //     eq: String
        //     le: String
        //     lt: String
        //     ge: String
        //     gt: String
        //     contains: String
        //     notContains: String
        //     between: [String]
        //     beginsWith: String
        //   }

        //   input TableStringFilterInput {
        //     ne: ID
        //     eq: ID
        //     le: ID
        //     lt: ID
        //     ge: ID
        //     gt: ID
        //     contains: ID
        //     notContains: ID
        //     between: [ID]
        //     beginsWith: ID
        //   }

        //   type WorkstationInstanceConnection {
        //     items: [WorkstationInstance]
        //     nextToken: String
        //   }

        //   type WorkstationInstance @aws_cognito_user_pools {
        //     id: ID!
        //     name: String!
        //     status: String!
        //   }
        // `,
      }
    );

    const appsyncDynamoRole = new iam.Role(
      this,
      camelCase(`${stackName}-EC2-Role`),
      {
        assumedBy: new iam.ServicePrincipal("appsync.amazonaws.com"),
      }
    );

    appsyncDynamoRole.addToPolicy(
      new iam.PolicyStatement({
        resources: ["*"],
        actions: ["ec2:*", "dynamodb:*", "lambda:*", "logs:*", "cognito-idp:*"],
        effect: iam.Effect.ALLOW,
      })
    );

    const lambdaDataSource = new appsync.CfnDataSource(
      this,
      camelCase(`${stackName}-lambda-DataSource`),
      {
        apiId: graphqlApi.attrApiId,
        name: camelCase(`${stackName}-lambda-DataSource`),
        type: "AWS_LAMBDA",
        lambdaConfig: {
          lambdaFunctionArn: lambdaFunc.functionArn,
        },
        serviceRoleArn: appsyncDynamoRole.roleArn,
      }
    );

    const listWorkstationInstancesResolver = new appsync.CfnResolver(
      this,
      camelCase(`${stackName}-listWorkstationInstances`),
      {
        apiId: graphqlApi.attrApiId,
        typeName: "Query",
        fieldName: "listWorkstationInstances",
        dataSourceName: lambdaDataSource.name,
      }
    );

    // importedOrCreatedTable.grantFullAccess(lambdaFunc);
  }
}
