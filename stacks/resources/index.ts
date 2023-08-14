import { Camera } from '@packages/app-graphql-types'
import { Duration, Fn, RemovalPolicy } from 'aws-cdk-lib'
import { CfnUserPoolGroup } from 'aws-cdk-lib/aws-cognito'
import { Effect, PolicyStatement, ServicePrincipal } from 'aws-cdk-lib/aws-iam'
import { CfnTopicRule } from 'aws-cdk-lib/aws-iot'
import { BucketAccessControl, LifecycleRule } from 'aws-cdk-lib/aws-s3'
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment'
import kebabCase from 'lodash.kebabcase'
import snakeCase from 'lodash.snakecase'
import {
	Bucket,
	Cognito,
	EventBus,
	Function,
	StackContext,
	Table
} from 'sst/constructs'

interface ResourcesStackOutput {
	auth: Cognito
	userDataTable: Table
	spotsTable: Table
	photosBucket: Bucket
	eventBus: EventBus
}

export function ResourcesStack({
	stack,
	app
}: StackContext): ResourcesStackOutput {
	const eventBus = new EventBus(stack, 'EventBus', {})

	const userDataTable = new Table(stack, 'UserData', {
		fields: {
			username: 'string'
		},
		primaryIndex: { partitionKey: 'username' },
		timeToLiveAttribute: 'ttl'
	})

	const adminGroupName = 'Admins'

	const auth = new Cognito(stack, 'Auth', {
		login: ['username'],
		triggers: {
			preSignUp: {
				handler: 'services/cognito/src/preSignUp.handler'
			},
			postConfirmation: {
				handler: 'services/cognito/src/postConfirmation.handler',
				environment: {
					USER_DATA_TABLE_NAME: userDataTable.tableName,
					ADMIN_GROUP_NAME: adminGroupName
				},
				permissions: [
					new PolicyStatement({
						effect: Effect.ALLOW,
						actions: ['cognito-idp:AdminAddUserToGroup'],
						resources: ['*']
					})
				]
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

	new CfnUserPoolGroup(stack, 'AdminsUserGroup', {
		groupName: adminGroupName,
		userPoolId: auth.userPoolId,
		description: 'Group for admin user which is taking photos of cars'
	})

	const replicatorFunction = new Function(stack, 'ReplicatorFunction', {
		handler: 'services/s3/src/replicator/index.handler',
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
		name: `${kebabCase(stack.stackName)}.photos`,
		cdk: {
			bucket: {
				autoDeleteObjects: app.stage !== 'master',
				removalPolicy:
					app.stage === 'master' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
				lifecycleRules: Object.values(Camera).map<LifecycleRule>(
					(cameraType) => ({
						id: `autoremoval-${cameraType}`,
						prefix: `${cameraType}/`,
						expiration: Duration.days(2)
					})
				)
			}
		},
		cors: [
			{
				allowedHeaders: ['*'],
				allowedMethods: ['PUT', 'POST'],
				allowedOrigins: ['*'],
				maxAge: '3000 seconds'
			}
		],
		notifications: {
			replicator: {
				function: replicatorFunction,
				events: ['object_created']
			}
		}
	})

	new BucketDeployment(stack, 'TestingPhotos', {
		sources: [Source.asset('./stacks/resources/assets/photos')],
		accessControl: BucketAccessControl.PUBLIC_READ,
		destinationBucket: photosBucket.cdk.bucket
	})

	replicatorFunction.attachPermissions([
		new PolicyStatement({
			actions: ['s3:GetObject'],
			resources: [Fn.join('', [photosBucket.bucketArn, '/*'])]
		})
	])

	const spotsTable = new Table(stack, 'SpotsTable', {
		fields: {
			spotNumber: 'string'
		},
		primaryIndex: {
			partitionKey: 'spotNumber'
		}
	})

	const iotInitFunction = new Function(stack, 'IotInitFunction', {
		handler: 'services/iot/src/initRule.handler',
		environment: {
			SPOTS_TABLE: spotsTable.tableName
		},
		permissions: [
			new PolicyStatement({
				effect: Effect.ALLOW,
				actions: ['iot:Publish'],
				resources: ['arn:aws:iot:eu-central-1:221940693656:topic/core2/parking']
			}),
			new PolicyStatement({
				effect: Effect.ALLOW,
				actions: ['dynamodb:GetItem'],
				resources: [spotsTable.tableArn]
			})
		]
	})

	iotInitFunction.addPermission('IotPermission', {
		principal: new ServicePrincipal('iot.amazonaws.com'),
		action: 'lambda:InvokeFunction'
	})

	new CfnTopicRule(stack, 'InitIotRule', {
		ruleName: snakeCase(`${stack.stackName}-init-rule`),
		topicRulePayload: {
			sql: `SELECT * FROM 'core2/parking-outputs' WHERE event="init"`,
			actions: [
				{
					lambda: {
						functionArn: iotInitFunction.functionArn
					}
				}
			]
		}
	})

	return {
		auth,
		eventBus,
		spotsTable,
		photosBucket,
		userDataTable
	}
}
