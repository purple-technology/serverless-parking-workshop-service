import { Query } from '@packages/app-graphql-types'
import { AppSyncIdentityCognito, AppSyncResolverHandler } from 'aws-lambda'
import AWS from 'aws-sdk'

const dynamoDb = new AWS.DynamoDB()
const eventBridge = new AWS.EventBridge()

export const handler: AppSyncResolverHandler<{}, Query['config']> = async (
	event
) => {
	const username = (event.identity as AppSyncIdentityCognito).username

	const targets = await eventBridge
		.listTargetsByRule({
			EventBusName: `${process.env.EVENT_BUS_NAME}`,
			Rule: `${username}-all`
		})
		.promise()

	const data = await dynamoDb
		.getItem({
			TableName: `${process.env.USER_DATA_TABLE_NAME}`,
			Key: {
				username: {
					S: username
				}
			},
			AttributesToGet: ['s3BucketName']
		})
		.promise()

	return {
		eventBusArn: (targets.Targets ?? [])[0]?.Arn ?? null,
		s3BucketName: data.Item?.s3BucketName?.S ?? null
	}
}
