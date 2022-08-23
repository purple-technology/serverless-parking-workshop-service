import {
	Mutation,
	MutationSetEventBusArnArgs
} from '@packages/app-graphql-types'
import * as EventBus from '@packages/event-bus'
import { AppSyncIdentityCognito, AppSyncResolverHandler } from 'aws-lambda'
import AWS from 'aws-sdk'

const eventBridge = new AWS.EventBridge()

export const handler: AppSyncResolverHandler<
	MutationSetEventBusArnArgs,
	Mutation['setEventBusArn']
> = async (event) => {
	const username = (event.identity as AppSyncIdentityCognito).username

	await eventBridge
		.putRule({
			Name: `${username}-all`,
			EventBusName: `${process.env.EVENT_BUS_NAME}`,
			Description: `Event bus rule for all service events for ${username}`,
			EventPattern: JSON.stringify({
				source: [EventBus.source],
				'detail-type': EventBus.detailTypes,
				detail: {
					targetUser: [EventBus.allUsersDetailValue]
				}
			})
		})
		.promise()

	await eventBridge
		.putTargets({
			EventBusName: `${process.env.EVENT_BUS_NAME}`,
			Rule: `${username}-all`,
			Targets: [
				{
					Id: username,
					Arn: event.arguments.eventBusArn,
					RoleArn: `${process.env.EVENT_BUS_ROLE_ARN}`
				}
			]
		})
		.promise()

	await eventBridge
		.putRule({
			Name: `${username}-personal`,
			EventBusName: `${process.env.EVENT_BUS_NAME}`,
			Description: `Event bus rule for personal service events for ${username}`,
			EventPattern: JSON.stringify({
				source: [EventBus.source],
				'detail-type': EventBus.detailTypes,
				detail: {
					targetUser: [username]
				}
			})
		})
		.promise()

	await eventBridge
		.putTargets({
			EventBusName: `${process.env.EVENT_BUS_NAME}`,
			Rule: `${username}-personal`,
			Targets: [
				{
					Id: username,
					Arn: event.arguments.eventBusArn,
					RoleArn: `${process.env.EVENT_BUS_ROLE_ARN}`
				}
			]
		})
		.promise()

	return {
		success: true
	}
}
