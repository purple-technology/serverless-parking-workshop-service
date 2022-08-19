import {
	Mutation,
	MutationSetEventBusArnArgs
} from '@packages/app-graphql-types'
import { AppSyncIdentityCognito, AppSyncResolverHandler } from 'aws-lambda'
import AWS from 'aws-sdk'

const eventBridge = new AWS.EventBridge()
const dynamoDb = new AWS.DynamoDB()

export const handler: AppSyncResolverHandler<
	MutationSetEventBusArnArgs,
	Mutation['setEventBusArn']
> = async (event) => {
	const username = (event.identity as AppSyncIdentityCognito).username

	const rule = await eventBridge
		.putRule({
			Name: username,
			EventBusName: `${process.env.EVENT_BUS_NAME}`,
			Description: `Event bus rule for ${username}`,
			EventPattern: JSON.stringify({
				source: [
					'human-verification.${file(macros.js):getExternalServiceStage}.verification'
				],
				'detail-type': ['finished'],
				detail: {
					target: [
						'my-axiory.onboarding.lightLiveUser',
						'my-axiory.onboarding.lightLiveUser.gracePeriod'
					],
					targetId: ['${self:provider.stage}']
				}
			})
		})
		.promise()

	const target = await eventBridge
		.putTargets({
			EventBusName: `${process.env.EVENT_BUS_NAME}`,
			Rule: username,
			Targets: [
				{
					Id: username,
					Arn: event.arguments.eventBusArn,
					RoleArn: `${process.env.EVENT_BUS_ROLE_ARN}`
				}
			]
		})
		.promise()

	console.log({ rule, target })

	await dynamoDb
		.updateItem({
			TableName: `${process.env.USER_DATA_TABLE_NAME}`,
			Key: {
				username: {
					S: username
				}
			},
			ExpressionAttributeNames: {
				'#eventBusArn': 'eventBusArn'
			},
			ExpressionAttributeValues: {
				':eventBusArn': {
					S: event.arguments.eventBusArn
				}
			},
			UpdateExpression: 'SET #eventBusArn = :eventBusArn'
		})
		.promise()

	return {
		success: true
	}
}
