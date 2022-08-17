import {
	Auth,
	Bucket,
	Function,
	StackContext
} from '@serverless-stack/resources'
import { Table } from '@serverless-stack/resources'
import { Fn } from 'aws-cdk-lib'
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam'
import kebabCase from 'lodash.kebabcase'

interface ResourcesStackOutput {
	auth: Auth
	userDataTable: Table
	photosBucket: Bucket
}

export function ResourcesStack({ stack }: StackContext): ResourcesStackOutput {
	stack.setDefaultFunctionProps({
		srcPath: 'services'
	})

	const userDataTable = new Table(stack, 'UserData', {
		fields: {
			username: 'string'
		},
		primaryIndex: { partitionKey: 'username' },
		timeToLiveAttribute: 'ttl'
	})

	const auth = new Auth(stack, 'Auth', {
		login: ['username'],
		triggers: {
			preSignUp: {
				handler: 'cognito/src/preSignUp.handler'
			},
			postConfirmation: {
				handler: 'cognito/src/postConfirmation.handler',
				environment: {
					USER_DATA_TABLE_NAME: userDataTable.tableName
				}
			}
		},
		cdk: {
			userPool: {
				passwordPolicy: {
					minLength: 6,
					requireDigits: false,
					requireLowercase: false,
					requireSymbols: false,
					requireUppercase: false
				}
			}
		}
	})

	auth.attachPermissionsForTriggers([
		new PolicyStatement({
			effect: Effect.ALLOW,
			actions: ['dynamodb:UpdateItem'],
			resources: [userDataTable.tableArn]
		})
	])

	const replicatorFunction = new Function(stack, 'ReplicatorFunction', {
		handler: 's3/src/replicator/index.handler',
		environment: {
			USER_DATA_TABLE_NAME: userDataTable.tableName
		},
		initialPolicy: [
			new PolicyStatement({
				actions: ['dynamodb:Scan'],
				resources: [userDataTable.tableArn]
			}),
			new PolicyStatement({
				effect: Effect.ALLOW,
				actions: ['s3:PutObject'],
				resources: ['*']
			})
		]
	})

	const photosBucket = new Bucket(stack, 'Photos', {
		name: `${kebabCase(stack.stackName)}.photos-2`,
		cors: [
			{
				allowedHeaders: ['*'],
				allowedMethods: ['PUT', 'POST'],
				allowedOrigins: ['*'],
				maxAge: '3000 seconds'
			}
		],
		notifications: {
			rekognition: {
				function: replicatorFunction,
				events: ['object_created']
			}
		}
	})

	replicatorFunction.attachPermissions([
		new PolicyStatement({
			actions: ['s3:GetObject'],
			resources: [Fn.join('', [photosBucket.bucketArn, '/*'])]
		})
	])

	return {
		auth,
		photosBucket,
		userDataTable
	}
}
