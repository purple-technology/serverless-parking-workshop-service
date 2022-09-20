import {
	Mutation,
	MutationReserveSpotArgs
} from '@packages/service-graphql-types'
import { AppSyncResolverHandler } from 'aws-lambda'
import AWS, { AWSError } from 'aws-sdk'

const dynamoDb = new AWS.DynamoDB()
const stepFunctions = new AWS.StepFunctions()
const iotData = new AWS.IotData({
	endpoint: 'a2ch2n9un5cick-ats.iot.eu-central-1.amazonaws.com'
})

export const handler: AppSyncResolverHandler<
	MutationReserveSpotArgs,
	Mutation['reserveSpot']
> = async (event) => {
	try {
		const date = new Date()
		const expireDate = new Date(
			date.valueOf() + event.arguments.timeSeconds * 1000
		)

		await dynamoDb
			.updateItem({
				TableName: `${process.env.RESERVATIONS_TABLE}`,
				Key: {
					spotNumber: {
						S: `${event.arguments.spot}`
					}
				},
				ExpressionAttributeValues: {
					':subject': {
						S: event.arguments.subject
					},
					':createdAt': {
						S: `${date.toISOString()}`
					},
					':expiresAt': {
						S: `${expireDate.toISOString()}`
					}
				},
				UpdateExpression:
					'SET subject = :subject, createdAt = :createdAt, expiresAt = :expiresAt',
				ConditionExpression:
					'attribute_not_exists(spotNumber) OR expiresAt <= :createdAt'
			})
			.promise()

		await iotData
			.publish({
				topic: 'core2/parking',
				payload: JSON.stringify({
					event: 'occupySpot',
					spotNumber: Number(event.arguments.spot)
				})
			})
			.promise()

		await stepFunctions
			.startExecution({
				stateMachineArn: `${process.env.EXPIRE_RESERVATION_SM}`,
				name: `${
					event.arguments.spot
				}__${date.toISOString()}__${expireDate.toISOString()}`.replaceAll(
					':',
					'-'
				),
				input: JSON.stringify({
					timestamp: expireDate.toISOString(),
					spotNumber: event.arguments.spot
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
