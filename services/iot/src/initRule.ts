import AWS from 'aws-sdk'

const iotData = new AWS.IotData({
	endpoint: 'a2ch2n9un5cick-ats.iot.eu-central-1.amazonaws.com'
})
const dynamoDb = new AWS.DynamoDB()

const getSpotValue = async (spot: number): Promise<number> => {
	const data = await dynamoDb
		.getItem({
			TableName: `${process.env.RESERVATIONS_TABLE}`,
			Key: {
				spotNumber: {
					S: `${spot}`
				}
			}
		})
		.promise()

	if (
		typeof data.Item === 'undefined' ||
		data.Item === null ||
		(typeof data.Item?.expiresAt?.S === 'string' &&
			data.Item?.expiresAt?.S <= new Date().toISOString())
	) {
		return 0
	}

	return 1
}

export const handler = async (): Promise<void> => {
	await iotData
		.publish({
			topic: 'core2/parking',
			payload: JSON.stringify({
				event: 'init',
				occupiedSpots: [
					await getSpotValue(1),
					await getSpotValue(2),
					await getSpotValue(3),
					await getSpotValue(4),
					await getSpotValue(5),
					await getSpotValue(6),
					await getSpotValue(7),
					await getSpotValue(8)
				]
			})
		})
		.promise()
}
