import {
	Mutation,
	MutationCancelReservationArgs
} from '@packages/service-graphql-types'
import { AppSyncResolverHandler } from 'aws-lambda'
import AWS, { AWSError } from 'aws-sdk'

const dynamoDb = new AWS.DynamoDB()
const iotData = new AWS.IotData({
	endpoint: 'a2ch2n9un5cick-ats.iot.eu-central-1.amazonaws.com'
})

export const handler: AppSyncResolverHandler<
	MutationCancelReservationArgs,
	Mutation['cancelReservation']
> = async (event) => {
	try {
		await dynamoDb
			.deleteItem({
				TableName: `${process.env.RESERVATIONS_TABLE}`,
				Key: {
					spotNumber: {
						S: `${event.arguments.spot}`
					}
				},
				ExpressionAttributeValues: {
					':subject': {
						S: event.arguments.subject
					}
				},
				ConditionExpression:
					'attribute_exists(spotNumber) AND subject = :subject'
			})
			.promise()

		await iotData
			.publish({
				topic: 'core2/parking',
				payload: JSON.stringify({
					event: 'freeSpot',
					spotNumber: Number(event.arguments.spot)
				})
			})
			.promise()
	} catch (err) {
		if ((err as AWSError).name !== 'ConditionalCheckFailedException') {
			throw err
		}

		return {
			success: false
		}
	}

	return {
		success: true
	}
}
