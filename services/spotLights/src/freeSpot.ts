import AWS, { DynamoDB } from 'aws-sdk'

const iotData = new AWS.IotData({
	endpoint: 'a2ch2n9un5cick-ats.iot.eu-central-1.amazonaws.com'
})

const dynamoDb = new DynamoDB()

type FreeSpotHandlerEvent = {
	timestamp: string
	spotNumber: number
}

export const handler = async (
	event: FreeSpotHandlerEvent
): Promise<FreeSpotHandlerEvent> => {
	await dynamoDb
		.deleteItem({
			TableName: `${process.env.SPOTS_TABLE}`,
			Key: {
				spotNumber: {
					S: `${event.spotNumber}`
				}
			},
			ExpressionAttributeValues: {
				':expiresAt': {
					S: event.timestamp
				}
			},
			ConditionExpression:
				'attribute_exists(spotNumber) AND attribute_exists(expiresAt) AND expiresAt = :expiresAt'
		})
		.promise()

	await iotData
		.publish({
			topic: 'core2/parking',
			payload: JSON.stringify({
				event: 'freeSpot',
				spotNumber: Number(event.spotNumber)
			})
		})
		.promise()

	return event
}
