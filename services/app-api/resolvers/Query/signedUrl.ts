import { Query } from '@packages/app-graphql-types'
import { AppSyncResolverHandler } from 'aws-lambda'
import AWS from 'aws-sdk'

const s3 = new AWS.S3({
	signatureVersion: 'v4',
	sslEnabled: true
})

export const handler: AppSyncResolverHandler<{}, Query['signedUrl']> = async (
	event
) => {
	console.log(JSON.stringify(event), process.env.PHOTOS_BUCKET_NAME)

	const params = {
		Bucket: process.env.PHOTOS_BUCKET_NAME,
		Key: 'photo.jpg',
		ContentType: 'image/jpeg',
		Expires: 2 * 60, // expires in 2 mins
		Conditions: [
			['content-length-range', 0, 10485760], // content length restrictions: 0-10MB
			['starts-with', '$key', 'photo.jpg'],
			['starts-with', '$Content-Type', `image/jpeg`]
		]
	}

	const presignedPost = s3.createPresignedPost(params)

	return {
		key: 'photo.jpg',
		url: presignedPost.url,
		fields: JSON.stringify(presignedPost.fields)
	}
}
