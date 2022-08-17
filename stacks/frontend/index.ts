import { getBasePath } from '@purple/serverless-git-branch-stage-plugin'
import { NextjsSite, StackContext, use } from '@serverless-stack/resources'
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager'

import { AppApiStack } from '../app-api'
import { ResourcesStack } from '../resources'

export function FrontendStack({ stack }: StackContext): void {
	const api = use(AppApiStack)
	const resources = use(ResourcesStack)

	const domainName = `${getBasePath()}-sls-ws-fe.workshops.purple-technology.com`

	new NextjsSite(stack, 'Next', {
		path: 'services/frontend',
		environment: {
			NEXT_PUBLIC_API_URL: api.appSyncApi.url,
			NEXT_PUBLIC_USER_POOL_ID: resources.auth.cdk.userPool.userPoolId,
			NEXT_PUBLIC_USER_POOL_CLIENT_ID:
				resources.auth.cdk.userPoolClient.userPoolClientId
		},
		customDomain: {
			domainName,
			hostedZone: 'workshops.purple-technology.com',
			cdk: {
				certificate: Certificate.fromCertificateArn(
					stack,
					'certificate',
					'arn:aws:acm:us-east-1:221940693656:certificate/ffae389e-59f7-469b-98c2-32933136b189'
				)
			}
		}
	})

	stack.addOutputs({
		DomainName: domainName
	})
}
