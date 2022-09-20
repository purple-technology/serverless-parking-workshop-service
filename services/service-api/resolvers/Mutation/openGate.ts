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

	return {
		success: true
	}
}
