import { PostConfirmationTriggerHandler } from 'aws-lambda'
import AWS from 'aws-sdk'

const cognitoIsp = new AWS.CognitoIdentityServiceProvider()
const dynamoDb = new AWS.DynamoDB()

export const handler: PostConfirmationTriggerHandler = async (event) => {
	if (event.userName === 'admin') {
		await cognitoIsp
			.adminAddUserToGroup({
				GroupName: `${process.env.ADMIN_GROUP_NAME}`,
				Username: event.userName,
				UserPoolId: event.userPoolId
			})
			.promise()
	} else {
		await dynamoDb
			.updateItem({
				TableName: `${process.env.USER_DATA_TABLE_NAME}`,
				Key: {
					username: {
						S: event.userName
					}
				},
				ExpressionAttributeNames: {
					'#ttl': 'ttl'
				},
				ExpressionAttributeValues: {
					':ttl': {
						N: `${Math.round(Date.now() / 1000) + 24 * 60 * 60}`
					}
				},
				UpdateExpression: 'SET #ttl = :ttl'
			})
			.promise()
	}

	return event
}
