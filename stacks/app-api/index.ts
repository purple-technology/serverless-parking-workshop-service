import {
	AuthorizationType,
	UserPoolDefaultAction
} from '@aws-cdk/aws-appsync-alpha'
import { AppSyncApi, StackContext, use } from '@serverless-stack/resources'
import { Fn } from 'aws-cdk-lib'
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam'

import { ResourcesStack } from '../resources'
import { ServiceApiStack } from '../service-api'
import { dataSources, resolvers } from './appSyncLoaders'

interface AppApiStackOutput {
	appSyncApi: AppSyncApi
}

export function AppApiStack({ stack }: StackContext): AppApiStackOutput {
	const resources = use(ResourcesStack)
	const serviceApi = use(ServiceApiStack)

	stack.setDefaultFunctionProps({
		srcPath: 'services'
	})

	const appSyncApi = new AppSyncApi(stack, 'AppGraphqlApi', {
		schema: 'services/app-api/schema.graphql',
		defaults: {
			function: {
				environment: {
					PHOTOS_BUCKET_NAME: resources.photosBucket.bucketName,
					USER_DATA_TABLE_NAME: resources.userDataTable.tableName,
					SERVICE_API_ID: serviceApi.appSyncApi.apiId
				}
			}
		},
		dataSources,
		resolvers,
		cdk: {
			graphqlApi: {
				authorizationConfig: {
					defaultAuthorization: {
						authorizationType: AuthorizationType.USER_POOL,
						userPoolConfig: {
							userPool: resources.auth.cdk.userPool,
							appIdClientRegex:
								resources.auth.cdk.userPoolClient.userPoolClientId,
							defaultAction: UserPoolDefaultAction.ALLOW
						}
					}
				}
			}
		}
	})
	appSyncApi.attachPermissions([
		new PolicyStatement({
			effect: Effect.ALLOW,
			actions: ['s3:PutObject'],
			resources: [Fn.join('', [resources.photosBucket.bucketArn, '/*'])]
		}),
		new PolicyStatement({
			effect: Effect.ALLOW,
			actions: ['dynamodb:PutItem', 'dynamodb:GetItem', 'dynamodb:UpdateItem'],
			resources: [resources.userDataTable.tableArn]
		}),
		new PolicyStatement({
			effect: Effect.ALLOW,
			actions: ['appsync:CreateApiKey'],
			resources: ['*']
		})
	])

	stack.addOutputs({
		AppApiEndpoint: appSyncApi.url
	})

	return {
		appSyncApi
	}
}
