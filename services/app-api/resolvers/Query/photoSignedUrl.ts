import { Query, QueryPhotoSignedUrlArgs } from '@packages/app-graphql-types'
import { AppSyncResolverHandler } from 'aws-lambda'
import AWS from 'aws-sdk'

const s3 = new AWS.S3({
	signatureVersion: 'v4',
	sslEnabled: true
})

export const handler: AppSyncResolverHandler<
	QueryPhotoSignedUrlArgs,
	Query['photoSignedUrl']
> = async (event) => {
	const key = `${event.arguments.camera}/${Date.now()}.jpg`

	const params = {
		Bucket: process.env.PHOTOS_BUCKET_NAME,
		Key: key,
		ContentType: 'image/jpeg',
		Expires: 2 * 60, // expires in 2 mins
		Conditions: [
			['content-length-range', 0, 10485760], // content length restrictions: 0-10MB
			['starts-with', '$key', key],
			['starts-with', '$Content-Type', `image/jpeg`]
		]
	}

	const presignedPost = s3.createPresignedPost(params)

	return {
		key,
		url: presignedPost.url,
		fields: JSON.stringify(presignedPost.fields)
	}
}
