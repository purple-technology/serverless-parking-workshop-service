import { AuthorizationType } from '@aws-cdk/aws-appsync-alpha'
import { AppSyncApi, StackContext } from '@serverless-stack/resources'

import { dataSources, resolvers } from './appSyncLoaders'

interface ServiceApiStackOutput {
	appSyncApi: AppSyncApi
}

export function ServiceApiStack({
	stack
}: StackContext): ServiceApiStackOutput {
	stack.setDefaultFunctionProps({
		srcPath: 'services'
	})

	const appSyncApi = new AppSyncApi(stack, 'ServiceGraphqlApi', {
		schema: 'services/service-api/schema.graphql',
		defaults: {
			function: {
				environment: {}
			}
		},
		dataSources,
		resolvers,
		cdk: {
			graphqlApi: {
				authorizationConfig: {
					defaultAuthorization: {
						authorizationType: AuthorizationType.API_KEY
					}
				}
			}
		}
	})

	stack.addOutputs({
		ServiceApiEndpoint: appSyncApi.url
	})

	return {
		appSyncApi
	}
}
