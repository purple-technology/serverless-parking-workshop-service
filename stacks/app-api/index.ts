import { Fn } from 'aws-cdk-lib'
import {
	AuthorizationType,
	MappingTemplate,
	UserPoolDefaultAction
} from 'aws-cdk-lib/aws-appsync'
import {
	Effect,
	PolicyDocument,
	PolicyStatement,
	Role,
	ServicePrincipal
} from 'aws-cdk-lib/aws-iam'
import { AppSyncApi, StackContext, use } from 'sst/constructs'

import { ResourcesStack } from '../resources'
import { ServiceApiStack } from '../service-api'
import { dataSources, resolvers } from './appSyncLoaders'

interface AppApiStackOutput {
	appSyncApi: AppSyncApi
}

export function AppApiStack({ stack }: StackContext): AppApiStackOutput {
	const resources = use(ResourcesStack)
	const serviceApi = use(ServiceApiStack)

	const eventBusRole = new Role(stack, 'EventBusRole', {
		assumedBy: new ServicePrincipal('events.amazonaws.com'),
		inlinePolicies: {
			enPolicy: new PolicyDocument({
				statements: [
					new PolicyStatement({
						effect: Effect.ALLOW,
						actions: ['events:PutEvents'],
						resources: ['*']
					})
				]
			})
		}
	})

	const appSyncApi = new AppSyncApi(stack, 'AppGraphqlApi', {
		schema: 'services/app-api/schema.graphql',
		defaults: {
			function: {
				environment: {
					PHOTOS_BUCKET_NAME: resources.photosBucket.bucketName,
					USER_DATA_TABLE_NAME: resources.userDataTable.tableName,
					SERVICE_API_ID: serviceApi.appSyncApi.apiId,
					EVENT_BUS_ROLE_ARN: eventBusRole.roleArn,
					EVENT_BUS_NAME: resources.eventBus.eventBusName
				}
			}
		},
		dataSources: {
			...dataSources,
			userDataTable: {
				type: 'dynamodb',
				table: resources.userDataTable
			}
		},
		resolvers: {
			...resolvers,
			'Mutation setS3BucketName': {
				dataSource: 'userDataTable',
				cdk: {
					resolver: {
						requestMappingTemplate: MappingTemplate.fromFile(
							'./stacks/app-api/mapping-templates/setS3BucketName.vtl'
						),
						responseMappingTemplate: MappingTemplate.fromFile(
							'./stacks/app-api/mapping-templates/voidResponse.vtl'
						)
					}
				}
			}
		},
		cdk: {
			graphqlApi: {
				authorizationConfig: {
					defaultAuthorization: {
						authorizationType: AuthorizationType.USER_POOL,
						userPoolConfig: {
							userPool: resources.auth.cdk.userPool,
							appIdClientRegex:
								resources.auth.cdk.userPoolClient.userPoolClientId,
							defaultAction: UserPoolDefaultAction.ALLOW
						}
					}
				}
			}
		}
	})

	appSyncApi.attachPermissions([
		new PolicyStatement({
			effect: Effect.ALLOW,
			actions: ['s3:PutObject', 's3:GetObject'],
			resources: [Fn.join('', [resources.photosBucket.bucketArn, '/*'])]
		}),
		new PolicyStatement({
			effect: Effect.ALLOW,
			actions: ['s3:PutObject'],
			resources: ['*']
		}),
		new PolicyStatement({
			effect: Effect.ALLOW,
			actions: ['dynamodb:PutItem', 'dynamodb:GetItem', 'dynamodb:UpdateItem'],
			resources: [resources.userDataTable.tableArn]
		}),
		new PolicyStatement({
			effect: Effect.ALLOW,
			actions: ['appsync:CreateApiKey'],
			resources: ['*']
		}),
		new PolicyStatement({
			effect: Effect.ALLOW,
			actions: ['iam:PassRole'],
			resources: [eventBusRole.roleArn]
		}),
		new PolicyStatement({
			effect: Effect.ALLOW,
			actions: [
				'events:PutRule',
				'events:DeleteRule',
				'events:PutTargets',
				'events:ListTargetsByRule'
			],
			resources: [
				Fn.sub(
					'arn:aws:events:${AWS::Region}:${AWS::AccountId}:rule/${eventBusName}/*',
					{
						eventBusName: resources.eventBus.eventBusName
					}
				)
			]
		}),
		new PolicyStatement({
			effect: Effect.ALLOW,
			actions: ['events:PutEvents'],
			resources: [resources.eventBus.eventBusArn]
		})
	])

	stack.addOutputs({
		AppApiEndpoint: appSyncApi.url
	})

	return {
		appSyncApi
	}
}
