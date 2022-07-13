import { App } from '@serverless-stack/resources'
import { RetentionDays } from 'aws-cdk-lib/aws-logs'

import { ApiStack } from './api'
import { FrontendStack } from './frontend'
import { ResourcesStack } from './resources'

export default function (app: App): void {
	app.setDefaultFunctionProps({
		runtime: 'nodejs16.x',
		logRetention: RetentionDays.THREE_MONTHS,
		bundle: {
			format: 'esm'
		}
	})

	app.stack(ResourcesStack, { id: 'resources' })
	app.stack(ApiStack, { id: 'api' })
	app.stack(FrontendStack, { id: 'frontend' })
}
