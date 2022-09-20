import { Function, StackContext, use } from '@serverless-stack/resources'
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam'
import { StateMachine, Wait, WaitTime } from 'aws-cdk-lib/aws-stepfunctions'
import { LambdaInvoke } from 'aws-cdk-lib/aws-stepfunctions-tasks'

import { ResourcesStack } from '../resources'

interface ReservationsStackOutput {
	expireReservationStateMachine: StateMachine
}

export function ReservationsStack({
	stack
}: StackContext): ReservationsStackOutput {
	const resources = use(ResourcesStack)

	const iotReservationFunction = new Function(stack, 'IotInitFunction', {
		handler: 'reservations/src/freeSpot.handler',
		environment: {
			RESERVATIONS_TABLE: resources.reservationsTable.tableName
		},
		permissions: [
			new PolicyStatement({
				effect: Effect.ALLOW,
				actions: ['iot:Publish'],
				resources: ['arn:aws:iot:eu-central-1:221940693656:topic/core2/parking']
			}),
			new PolicyStatement({
				effect: Effect.ALLOW,
				actions: ['dynamodb:DeleteItem'],
				resources: [resources.reservationsTable.tableArn]
			})
		]
	})

	const expireReservationStateMachine = new StateMachine(
		stack,
		'ExpireReservationStateMachine',
		{
			definition: new Wait(stack, 'Wait', {
				time: WaitTime.timestampPath('$.timestamp')
			}).next(
				new LambdaInvoke(stack, 'IotFunction', {
					lambdaFunction: iotReservationFunction
				})
			)
		}
	)

	return {
		expireReservationStateMachine
	}
}
