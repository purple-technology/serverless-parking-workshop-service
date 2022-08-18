import { Query } from '@packages/app-graphql-types'
import { AppSyncIdentityCognito, AppSyncResolverHandler } from 'aws-lambda'
import AWS from 'aws-sdk'

const dynamoDb = new AWS.DynamoDB()

export const handler: AppSyncResolverHandler<{}, Query['config']> = async (
	event
) => {
	const username = (event.identity as AppSyncIdentityCognito).username

	const data = await dynamoDb
		.getItem({
			TableName: `${process.env.USER_DATA_TABLE_NAME}`,
			Key: {
				username: {
					S: username
				}
			},
			AttributesToGet: ['eventBusArn', 's3BucketName']
		})
		.promise()

	const eventBusArn = data.Item?.eventBusArn?.S ?? null
	const s3BucketName = data.Item?.s3BucketName?.S ?? null

	return {
		eventBusArn,
		s3BucketName
	}
}
