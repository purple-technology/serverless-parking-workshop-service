import { S3Handler } from 'aws-lambda'
import AWS from 'aws-sdk'

const rekognition = new AWS.Rekognition()

export const handler: S3Handler = async (events) => {
	await Promise.all(
		events.Records.map(async (event) => {
			const data = await rekognition
				.detectText({
					Image: {
						S3Object: {
							Bucket: event.s3.bucket.name,
							Name: event.s3.object.key
						}
					}
				})
				.promise()

			console.log(JSON.stringify(data))
		})
	)
}
