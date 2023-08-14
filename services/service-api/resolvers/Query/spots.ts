import { Query, Spot, SpotStatus } from '@packages/service-graphql-types'
import { AppSyncResolverHandler } from 'aws-lambda'
import AWS from 'aws-sdk'

const dynamoDb = new AWS.DynamoDB()

const getSpot = async (spot: string): Promise<Spot> => {
	const data = await dynamoDb
		.getItem({
			TableName: `${process.env.SPOTS_TABLE}`,
			Key: {
				spotNumber: {
					S: spot
				}
			}
		})
		.promise()

	if (typeof data.Item === 'undefined') {
		return {
			spot,
			status: SpotStatus.Off
		}
	}

	return {
		spot,
		status: SpotStatus.On
	}
}

export const handler: AppSyncResolverHandler<{}, Query['spots']> = async () => {
	return [
		await getSpot('1'),
		await getSpot('2'),
		await getSpot('3'),
		await getSpot('4'),
		await getSpot('5'),
		await getSpot('6'),
		await getSpot('7'),
		await getSpot('8')
	]
}
