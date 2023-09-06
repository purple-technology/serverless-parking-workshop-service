import { Query } from '@packages/app-graphql-types'
import { AppSyncIdentityCognito, AppSyncResolverHandler } from 'aws-lambda'
import AWS, { AWSError } from 'aws-sdk'

const dynamoDb = new AWS.DynamoDB()
const eventBridge = new AWS.EventBridge()
const ec2 = new AWS.EC2()

export const handler: AppSyncResolverHandler<{}, Query['config']> = async (
	event
) => {
	const username = (event.identity as AppSyncIdentityCognito).username

	let targets = null

	try {
		targets = await eventBridge
			.listTargetsByRule({
				EventBusName: `${process.env.EVENT_BUS_NAME}`,
				Rule: `${username}-all`
			})
			.promise()
	} catch (err) {
		if ((err as AWSError).name !== 'ResourceNotFoundException') {
			throw err
		}
	}

	const data = await dynamoDb
		.getItem({
			TableName: `${process.env.USER_DATA_TABLE_NAME}`,
			Key: {
				username: {
					S: username
				}
			},
			AttributesToGet: ['s3BucketName', 'instanceId']
		})
		.promise()

	let isMachineRunning = false
	let machineAddress = null
	if (typeof data.Item?.instanceId?.S !== 'undefined') {
		try {
			isMachineRunning = true

			const statuses = await ec2
				.describeInstanceStatus({
					InstanceIds: [data.Item?.instanceId?.S]
				})
				.promise()

			if (
				typeof statuses.InstanceStatuses !== 'undefined' &&
				statuses.InstanceStatuses.length > 0 &&
				typeof statuses.InstanceStatuses[0].SystemStatus !== 'undefined' &&
				statuses.InstanceStatuses[0].SystemStatus.Status !== 'initializing'
			) {
				const instances = await ec2
					.describeInstances({
						InstanceIds: [data.Item?.instanceId?.S]
					})
					.promise()

				machineAddress =
					typeof instances.Reservations !== 'undefined' &&
					typeof instances.Reservations[0].Instances !== 'undefined'
						? instances.Reservations[0].Instances[0].PublicDnsName
						: null
			}
		} catch (err) {
			console.error(err)
			isMachineRunning = false
			machineAddress = null
		}
	}

	return {
		isMachineRunning,
		machineAddress,
		eventBusArn: (targets?.Targets ?? [])[0]?.Arn ?? null,
		s3BucketName: data.Item?.s3BucketName?.S ?? null
	}
}
