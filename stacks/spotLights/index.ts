import { DetailType, source } from '@packages/event-bus'
import { Function, StackContext, use } from '@serverless-stack/resources'
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam'
import {
	StateMachine,
	TaskInput,
	Wait,
	WaitTime
} from 'aws-cdk-lib/aws-stepfunctions'
import {
	EventBridgePutEvents,
	LambdaInvoke
} from 'aws-cdk-lib/aws-stepfunctions-tasks'

import { ResourcesStack } from '../resources'

interface SpotLightsStackOutput {
	expireSpotLightStateMachine: StateMachine
}

export function SpotLightsStack({
	stack
}: StackContext): SpotLightsStackOutput {
	const resources = use(ResourcesStack)

	const iotSpotLightFunction = new Function(stack, 'IotInitFunction', {
		handler: 'spotLights/src/freeSpot.handler',
		environment: {
			SPOTS_TABLE: resources.spotsTable.tableName
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
				resources: [resources.spotsTable.tableArn]
			})
		]
	})

	const detailType: DetailType = 'spot-expired'

	const expireSpotLightStateMachine = new StateMachine(
		stack,
		'ExpireSpotLightStateMachine',
		{
			definition: new Wait(stack, 'Wait', {
				time: WaitTime.timestampPath('$.timestamp')
			})
				.next(
					new LambdaInvoke(stack, 'IotFunction', {
						lambdaFunction: iotSpotLightFunction
					})
				)
				.next(
					new EventBridgePutEvents(stack, 'PutEvents', {
						entries: [
							{
								eventBus: resources.eventBus.cdk.eventBus,
								detail: TaskInput.fromObject({
									'spotNumber.$': '$.spotNumber'
								}),
								detailType,
								source
							}
						]
					})
				)
		}
	)

	return {
		expireSpotLightStateMachine
	}
}
