import { AuthorizationType } from '@aws-cdk/aws-appsync-alpha'
import { AppSyncApi, StackContext, use } from '@serverless-stack/resources'
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam'

import { ResourcesStack } from '../resources'
import { SpotLightsStack } from '../spotLights'
import { dataSources, resolvers } from './appSyncLoaders'

interface ServiceApiStackOutput {
	appSyncApi: AppSyncApi
}

export function ServiceApiStack({
	stack
}: StackContext): ServiceApiStackOutput {
	const resources = use(ResourcesStack)
	const spotLights = use(SpotLightsStack)

	const appSyncApi = new AppSyncApi(stack, 'ServiceGraphqlApi', {
		schema: 'services/service-api/schema.graphql',
		defaults: {
			function: {
				environment: {
					SPOTS_TABLE: resources.spotsTable.tableName,
					EXPIRE_SPOT_LIGHTS_SM:
						spotLights.expireSpotLightStateMachine.stateMachineArn,
					EVENT_BUS_NAME: resources.eventBus.eventBusName
				}
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

	appSyncApi.attachPermissions([
		new PolicyStatement({
			effect: Effect.ALLOW,
			actions: ['iot:Publish'],
			resources: ['arn:aws:iot:eu-central-1:221940693656:topic/core2/parking']
		}),
		new PolicyStatement({
			effect: Effect.ALLOW,
			actions: [
				'dynamodb:PutItem',
				'dynamodb:UpdateItem',
				'dynamodb:DeleteItem',
				'dynamodb:GetItem'
			],
			resources: [resources.spotsTable.tableArn]
		}),
		new PolicyStatement({
			effect: Effect.ALLOW,
			actions: ['states:StartExecution'],
			resources: [spotLights.expireSpotLightStateMachine.stateMachineArn]
		}),
		new PolicyStatement({
			effect: Effect.ALLOW,
			actions: ['events:PutEvents'],
			resources: [resources.eventBus.eventBusArn]
		})
	])

	return {
		appSyncApi
	}
}
