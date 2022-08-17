import { Query } from '@packages/app-graphql-types'
import { AppSyncIdentityCognito, AppSyncResolverHandler } from 'aws-lambda'
import AWS from 'aws-sdk'

const dynamoDb = new AWS.DynamoDB()
const appSync = new AWS.AppSync()

export const handler: AppSyncResolverHandler<{}, Query['api']> = async (
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
			}
		})
		.promise()

	let apiKey: string = data.Item?.apiKey?.S as string

	if (
		typeof data.Item === 'undefined' ||
		typeof data.Item?.apiKey?.S === 'undefined'
	) {
		const newKey = await appSync
			.createApiKey({
				apiId: `${process.env.SERVICE_API_ID}`,
				description: `Username: ${username}`,
				expires: Math.ceil(Date.now() / 1000 / 60 / 60) * 60 * 60 + 24 * 60 * 60
			})
			.promise()

		if (
			typeof newKey.apiKey === 'undefined' ||
			typeof newKey.apiKey.id === 'undefined'
		) {
			console.log(JSON.stringify(newKey))
			throw new Error('No response from AppSync when creating API Key')
		}

		apiKey = newKey.apiKey.id

		await dynamoDb
			.updateItem({
				TableName: `${process.env.USER_DATA_TABLE_NAME}`,
				Key: {
					username: {
						S: username
					}
				},
				ExpressionAttributeNames: {
					'#apiKey': 'apiKey'
				},
				ExpressionAttributeValues: {
					':apiKey': {
						S: newKey.apiKey.id
					}
				},
				UpdateExpression: 'SET #apiKey = :apiKey'
			})
			.promise()
	}

	return {
		key: apiKey
	}
}
