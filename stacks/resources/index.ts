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

	const rekognitionFunction = new Function(stack, 'RekognitionFunction', {
		handler: 'rekognition/src/processImage/index.handler',
		initialPolicy: [
			new PolicyStatement({
				actions: ['rekognition:DetectText'],
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
				function: rekognitionFunction,
				events: ['object_created']
			}
		}
	})

	rekognitionFunction.attachPermissions([
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
