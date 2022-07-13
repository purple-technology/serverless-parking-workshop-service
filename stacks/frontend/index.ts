import { getBasePath } from '@purple/serverless-git-branch-stage-plugin'
import { NextjsSite, StackContext, use } from '@serverless-stack/resources'
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager'

import { ApiStack } from '../api'
import { ResourcesStack } from '../resources'

export function FrontendStack({ stack }: StackContext): void {
	const api = use(ApiStack)
	const resources = use(ResourcesStack)

	const domainName = `${getBasePath()}-sls-ws-fe.purple-technology.com`

	new NextjsSite(stack, 'Next', {
		path: 'src/frontend',
		environment: {
			NEXT_PUBLIC_API_URL: api.appSyncApi.url,
			NEXT_PUBLIC_USER_POOL_ID: resources.auth.cdk.userPool.userPoolId,
			NEXT_PUBLIC_USER_POOL_CLIENT_ID:
				resources.auth.cdk.userPoolClient.userPoolClientId
		},
		customDomain: {
			domainName,
			hostedZone: 'purple-technology.com',
			cdk: {
				certificate: Certificate.fromCertificateArn(
					stack,
					'certificate',
					'arn:aws:acm:us-east-1:922925171681:certificate/b26a8b5a-2b90-4486-9532-c5849d37df7d'
				)
			}
		}
	})

	stack.addOutputs({
		DomainName: domainName
	})
}
