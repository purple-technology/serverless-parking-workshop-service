import {
	AuthorizationType,
	UserPoolDefaultAction
} from '@aws-cdk/aws-appsync-alpha'
import { AppSyncApi, StackContext, use } from '@serverless-stack/resources'
import { Fn } from 'aws-cdk-lib'
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam'

import { ResourcesStack } from '../resources'
import { dataSources, resolvers } from './appSyncLoaders'

interface ApiStackOutput {
	appSyncApi: AppSyncApi
}

export function ApiStack({ stack }: StackContext): ApiStackOutput {
	const resources = use(ResourcesStack)

	stack.setDefaultFunctionProps({
		srcPath: 'services'
	})

	const appSyncApi = new AppSyncApi(stack, 'GraphqlApi', {
		schema: 'services/api/schema.graphql',
		defaults: {
			function: {
				environment: {
					PHOTOS_BUCKET_NAME: resources.photosBucket.bucketName
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
		})
	])

	stack.addOutputs({
		ApiEndpoint: appSyncApi.url
	})

	return {
		appSyncApi
	}
}
