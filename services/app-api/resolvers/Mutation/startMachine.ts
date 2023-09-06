import { Mutation, MutationStartMachineArgs } from '@packages/app-graphql-types'
import { AppSyncIdentityCognito, AppSyncResolverHandler } from 'aws-lambda'
import AWS from 'aws-sdk'

const dynamoDb = new AWS.DynamoDB()
const ec2 = new AWS.EC2()

const provisionScript = ({
	accessKeyId,
	secretAccessKey,
	sessionToken
}: {
	accessKeyId: string
	secretAccessKey: string
	sessionToken: string
}): string =>
	Buffer.from(
		`#!/bin/bash
export HOME=/home/ubuntu

apt-get update
su ubuntu -c 'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash'
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install v16
nvm alias default v16
nvm use default

apt-get install -y awscli

sed -i 's/PasswordAuthentication no/PasswordAuthentication yes/g' /etc/ssh/sshd_config
service ssh restart
echo ubuntu:purple | chpasswd

cd $HOME
su ubuntu -c 'git clone https://github.com/purple-technology/serverless-parking-workshop-boilerplate.git'

su ubuntu -c 'aws configure set aws_access_key_id ${accessKeyId}'
su ubuntu -c 'aws configure set aws_secret_access_key ${secretAccessKey}'
su ubuntu -c 'aws configure set aws_session_token ${sessionToken}'

echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p
`,
		'utf-8'
	).toString('base64')

export const handler: AppSyncResolverHandler<
	MutationStartMachineArgs,
	Mutation['startMachine']
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
			AttributesToGet: ['instanceId']
		})
		.promise()

	if (
		typeof data.Item === 'undefined' ||
		typeof data.Item?.instanceId?.S !== 'undefined'
	) {
		throw new Error(
			`User already has allocated instance "${data.Item?.instanceId?.S}"`
		)
	}

	const response = await ec2
		.runInstances({
			ImageId: 'ami-09042b2f6d07d164a',
			InstanceType: 't2.large',
			MaxCount: 1,
			MinCount: 1,
			KeyName: 'volfik-macbook',
			SecurityGroupIds: ['sg-05e5d93ac6dc590e9'],
			UserData: provisionScript(event.arguments),
			BlockDeviceMappings: [
				{
					DeviceName: '/dev/sda1',
					Ebs: {
						VolumeSize: 20,
						DeleteOnTermination: true,
						VolumeType: 'gp2'
					}
				}
			]
		})
		.promise()

	console.log(JSON.stringify(response))

	if (typeof response.Instances === 'undefined') {
		throw new Error(`Instance creation failed. No instance returned.`)
	}

	await dynamoDb
		.updateItem({
			TableName: `${process.env.USER_DATA_TABLE_NAME}`,
			Key: {
				username: {
					S: username
				}
			},
			ExpressionAttributeNames: {
				'#instanceId': 'instanceId'
			},
			ExpressionAttributeValues: {
				':instanceId': {
					S: response.Instances[0].InstanceId
				}
			},
			UpdateExpression: 'SET #instanceId = :instanceId'
		})
		.promise()

	return {
		success: true
	}
}
