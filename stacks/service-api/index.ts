import { AuthorizationType } from '@aws-cdk/aws-appsync-alpha'
import { AppSyncApi, StackContext, use } from '@serverless-stack/resources'
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam'

import { ReservationsStack } from '../reservations'
import { ResourcesStack } from '../resources'
import { dataSources, resolvers } from './appSyncLoaders'

interface ServiceApiStackOutput {
	appSyncApi: AppSyncApi
}

export function ServiceApiStack({
	stack
}: StackContext): ServiceApiStackOutput {
	const resources = use(ResourcesStack)
	const reservations = use(ReservationsStack)

	const appSyncApi = new AppSyncApi(stack, 'ServiceGraphqlApi', {
		schema: 'services/service-api/schema.graphql',
		defaults: {
			function: {
				environment: {
					RESERVATIONS_TABLE: resources.reservationsTable.tableName,
					EXPIRE_RESERVATION_SM:
						reservations.expireReservationStateMachine.stateMachineArn
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
			resources: [resources.reservationsTable.tableArn]
		}),
		new PolicyStatement({
			effect: Effect.ALLOW,
			actions: ['states:StartExecution'],
			resources: [reservations.expireReservationStateMachine.stateMachineArn]
		})
	])

	return {
		appSyncApi
	}
}
