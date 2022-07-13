import {
	AuthorizationType,
	UserPoolDefaultAction
} from '@aws-cdk/aws-appsync-alpha'
import { AppSyncApi, StackContext, use } from '@serverless-stack/resources'

import { ResourcesStack } from '../resources'
import { dataSources, resolvers } from './appSyncLoaders'

interface ApiStackOutput {
	appSyncApi: AppSyncApi
}

export function ApiStack({ stack }: StackContext): ApiStackOutput {
	const resources = use(ResourcesStack)

	stack.setDefaultFunctionProps({
		srcPath: 'src'
	})

	const appSyncApi = new AppSyncApi(stack, 'GraphqlApi', {
		schema: 'src/api/schema.graphql',
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
							defaultAction: UserPoolDefaultAction.DENY
						}
					}
				}
			}
		}
	})

	stack.addOutputs({
		ApiEndpoint: appSyncApi.url
	})

	return {
		appSyncApi
	}
}
