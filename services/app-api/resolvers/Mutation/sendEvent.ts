import { Mutation, MutationSendEventArgs } from '@packages/app-graphql-types'
import * as EventBus from '@packages/event-bus'
import { AppSyncIdentityCognito, AppSyncResolverHandler } from 'aws-lambda'
import AWS from 'aws-sdk'

const eventBridge = new AWS.EventBridge()

/**

{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "allow_account_to_put_events",
    "Effect": "Allow",
    "Principal": {
      "AWS": "arn:aws:iam::221940693656:root"
    },
    "Action": "events:PutEvents",
    "Resource": "arn:aws:events:eu-central-1:922925171681:event-bus/filip-test"
  }]
}


{
  "source": ["parking-service"],
  "detail-type": ["gate-opened", "gate-closed", "reservation-created", "reservation-expired"]
}

*/

export const handler: AppSyncResolverHandler<
	MutationSendEventArgs,
	Mutation['sendEvent']
> = async (event) => {
	const username = (event.identity as AppSyncIdentityCognito).username

	const template = EventBus.templates[event.arguments.eventId]

	if (typeof template === 'undefined') {
		throw new Error(`No template for event "${event.arguments.eventId}" found.`)
	}

	const templateEvent = EventBus.templates[event.arguments.eventId](username)

	await eventBridge
		.putEvents({
			Entries: [
				{
					EventBusName: `${process.env.EVENT_BUS_NAME}`,
					Source: templateEvent.source,
					DetailType: templateEvent.detailType,
					Detail: JSON.stringify(templateEvent.detail)
				}
			]
		})
		.promise()

	return {
		success: true
	}
}
