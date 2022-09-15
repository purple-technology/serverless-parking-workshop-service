import {
	Camera,
	Mutation,
	MutationCopyS3ObjectArgs
} from '@packages/app-graphql-types'
import { AppSyncIdentityCognito, AppSyncResolverHandler } from 'aws-lambda'
import AWS from 'aws-sdk'

const s3 = new AWS.S3()
const dynamoDb = new AWS.DynamoDB()

const cameraMap: { [objectId: string]: Camera } = {
	'1': Camera.Entrance,
	'2': Camera.Entrance,
	'3': Camera.Exit,
	'4': Camera.Exit,
	'5': Camera.ParkingLot,
	'6': Camera.ParkingLot
}

export const handler: AppSyncResolverHandler<
	MutationCopyS3ObjectArgs,
	Mutation['copyS3Object']
> = async (event) => {
	const username = (event.identity as AppSyncIdentityCognito).username

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

	if (
		typeof data.Item === 'undefined' ||
		typeof data.Item?.s3BucketName?.S === 'undefined'
	) {
		throw new Error(
			'No S3 bucket found, make sure to set it in "AWS Settings" tab.'
		)
	}

	try {
		const camera = cameraMap[event.arguments.objectId]

		if (typeof camera === 'undefined') {
			throw new Error(
				`Object with objectId="${event.arguments.objectId}" not found`
			)
		}

		await s3
			.copyObject({
				Bucket: data.Item.s3BucketName.S,
				Key: `${camera}/${Date.now()}.jpg`,
				CopySource: `${process.env.PHOTOS_BUCKET_NAME}/${event.arguments.objectId}.jpg`
			})
			.promise()

		console.log(
			JSON.stringify({
				message: 'copy_success',
				destinationBucket: data.Item.s3BucketName.S,
				username,
				objectId: event.arguments.objectId
			})
		)
	} catch (err) {
		console.log(
			JSON.stringify({
				message: 'copy_error',
				destinationBucket: data.Item.s3BucketName.S,
				username,
				objectId: event.arguments.objectId,
				errorMessage: (err as AWS.AWSError).message
			})
		)

		throw err
	}

	return {
		success: true
	}
}
