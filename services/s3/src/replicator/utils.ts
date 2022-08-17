import AWS from 'aws-sdk'

const dynamoDb = new AWS.DynamoDB()

export const getAllBuckets = async (
	lastEvaluatedKey?: AWS.DynamoDB.Key
): Promise<{ bucketName: string; username: string }[]> => {
	let params: AWS.DynamoDB.ScanInput = {
		TableName: `${process.env.USER_DATA_TABLE_NAME}`,
		ExpressionAttributeNames: {
			'#UN': 'username',
			'#BN': 'BucketName'
		},
		FilterExpression: 'attribute_exists(#BN)',
		ProjectionExpression: '#UN, #BN'
	}

	if (typeof lastEvaluatedKey !== 'undefined') {
		params.ExclusiveStartKey = lastEvaluatedKey
	}

	const bucket = await dynamoDb.scan(params).promise()

	const buckets = (bucket.Items ?? []).map((item) => ({
		bucketName: `${item.BucketName.S}`,
		username: `${item.username.S}`
	}))

	return [
		...buckets,
		...(typeof bucket.LastEvaluatedKey !== 'undefined'
			? await getAllBuckets(bucket.LastEvaluatedKey)
			: [])
	]
}
