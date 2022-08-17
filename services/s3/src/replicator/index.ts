import { S3Handler } from 'aws-lambda'
import AWS from 'aws-sdk'

import { getAllBuckets } from './utils'

const s3 = new AWS.S3()

export const handler: S3Handler = async (events) => {
	const buckets = await getAllBuckets()

	for (const event of events.Records) {
		for (const { bucketName, username } of buckets) {
			try {
				await s3
					.copyObject({
						Bucket: bucketName,
						Key: event.s3.object.key,
						CopySource: `${event.s3.bucket.name}/${event.s3.object.key}`
					})
					.promise()

				console.log(
					JSON.stringify({
						message: 'copy_success',
						destinationBucket: bucketName,
						username,
						key: event.s3.object.key
					})
				)
			} catch (err) {
				console.log(
					JSON.stringify({
						message: 'copy_error',
						destinationBucket: bucketName,
						username,
						key: event.s3.object.key,
						errorMessage: (err as AWS.AWSError).message
					})
				)
			}
		}
	}
}
