import { Camera } from '@packages/app-graphql-types'
import {
	Auth,
	Bucket,
	EventBus,
	Function,
	StackContext
} from '@serverless-stack/resources'
import { Table } from '@serverless-stack/resources'
import { Duration, Fn, RemovalPolicy } from 'aws-cdk-lib'
import { CfnUserPoolGroup } from 'aws-cdk-lib/aws-cognito'
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam'
import { BucketAccessControl, LifecycleRule } from 'aws-cdk-lib/aws-s3'
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment'
import kebabCase from 'lodash.kebabcase'

interface ResourcesStackOutput {
	auth: Auth
	userDataTable: Table
	photosBucket: Bucket
	eventBus: EventBus
}
/**
 *
 *
 * @export
 * @param {StackContext} { stack }
 * @returns {ResourcesStackOutput}
 */
export function ResourcesStack({
	stack,
	app
}: StackContext): ResourcesStackOutput {
	stack.setDefaultFunctionProps({
		srcPath: 'services'
	})

	const eventBus = new EventBus(stack, 'EventBus', {})

	const userDataTable = new Table(stack, 'UserData', {
		fields: {
			username: 'string'
		},
		primaryIndex: { partitionKey: 'username' },
		timeToLiveAttribute: 'ttl'
	})

	const adminGroupName = 'Admins'

	const auth = new Auth(stack, 'Auth', {
		login: ['username'],
		triggers: {
			preSignUp: {
				handler: 'cognito/src/preSignUp.handler'
			},
			postConfirmation: {
				handler: 'cognito/src/postConfirmation.handler',
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

	return {
		auth,
		eventBus,
		photosBucket,
		userDataTable
	}
}
