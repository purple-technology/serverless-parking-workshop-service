import { Query, Reservation } from '@packages/service-graphql-types'
import { AppSyncResolverHandler } from 'aws-lambda'
import AWS from 'aws-sdk'

const dynamoDb = new AWS.DynamoDB()

const getSpot = async (spot: number): Promise<Reservation | null> => {
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

	if (typeof data.Item === 'undefined') {
		return null
	}

	return {
		subject: `${data?.Item?.subject?.S}`,
		creationTimestamp: `${data?.Item?.createdAt?.S}`,
		spot: `${data?.Item?.spotNumber?.S}`,
		expirationTimestamp: `${data?.Item?.expiresAt?.S}`
	}
}

export const handler: AppSyncResolverHandler<
	{},
	Query['parkingLot']
> = async () => {
	return {
		reservations: [
			await getSpot(1),
			await getSpot(2),
			await getSpot(3),
			await getSpot(4),
			await getSpot(5),
			await getSpot(6),
			await getSpot(7),
			await getSpot(8)
		].filter((spot): spot is Reservation => spot !== null),
		time: new Date().toISOString()
	}
}
