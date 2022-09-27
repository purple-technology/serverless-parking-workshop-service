import {
	Mutation,
	MutationOccupySpotArgs
} from '@packages/service-graphql-types'
import { AppSyncResolverHandler } from 'aws-lambda'
import AWS, { AWSError } from 'aws-sdk'

const dynamoDb = new AWS.DynamoDB()
const stepFunctions = new AWS.StepFunctions()
const iotData = new AWS.IotData({
	endpoint: 'a2ch2n9un5cick-ats.iot.eu-central-1.amazonaws.com'
})

export const handler: AppSyncResolverHandler<
	MutationOccupySpotArgs,
	Mutation['occupySpot']
> = async (event) => {
	try {
		if ((event.arguments.timeSeconds ?? 0) < 0) {
			return {
				success: false
			}
		}

		const date = new Date()
		const expireDate =
			typeof event.arguments.timeSeconds === 'number'
				? new Date(date.valueOf() + event.arguments.timeSeconds * 1000)
				: undefined

		await dynamoDb
			.updateItem({
				TableName: `${process.env.SPOTS_TABLE}`,
				Key: {
					spotNumber: {
						S: `${event.arguments.spot}`
					}
				},
				ExpressionAttributeValues: {
					':createdAt': {
						S: `${date.toISOString()}`
					},
					...(typeof expireDate === 'undefined'
						? {}
						: {
								':expiresAt': {
									S: `${expireDate.toISOString()}`
								}
						  })
				},
				UpdateExpression:
					typeof expireDate === 'undefined'
						? 'SET createdAt = :createdAt REMOVE expiresAt'
						: 'SET createdAt = :createdAt, expiresAt = :expiresAt',
				ConditionExpression: `attribute_not_exists(spotNumber)${
					typeof expireDate === 'undefined'
						? ' OR attribute_exists(expiresAt)'
						: ''
				}`
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

		if (typeof expireDate !== 'undefined') {
			await stepFunctions
				.startExecution({
					stateMachineArn: `${process.env.EXPIRE_SPOT_LIGHTS_SM}`,
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
		}
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
