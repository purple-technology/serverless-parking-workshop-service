import { DetailType, source } from '@packages/event-bus'
import {
	Gate,
	Mutation,
	MutationOpenGateArgs
} from '@packages/service-graphql-types'
import { AppSyncResolverHandler } from 'aws-lambda'
import AWS from 'aws-sdk'

const iotData = new AWS.IotData({
	endpoint: 'a2ch2n9un5cick-ats.iot.eu-central-1.amazonaws.com'
})
const eventBridge = new AWS.EventBridge()

export const handler: AppSyncResolverHandler<
	MutationOpenGateArgs,
	Mutation['openGate']
> = async (event) => {
	await iotData
		.publish({
			topic: 'core2/parking',
			payload: JSON.stringify({
				event: event.arguments.gate === Gate.Entry ? 'allowEnter' : 'allowExit'
			})
		})
		.promise()

	const gateDetailType: DetailType = 'gate-opened'
	await eventBridge
		.putEvents({
			Entries: [
				{
					EventBusName: `${process.env.EVENT_BUS_NAME}`,
					Source: source,
					DetailType: gateDetailType,
					Detail: JSON.stringify({
						gate: event.arguments.gate === Gate.Entry ? 'entry' : 'exit'
					})
				}
			]
		})
		.promise()

	return {
		success: true
	}
}
