import { App } from '@serverless-stack/resources'

import { AppApiStack } from './app-api'
import { FrontendStack } from './frontend'
import { ResourcesStack } from './resources'
import { ServiceApiStack } from './service-api'

export default function (app: App): void {
	if (app.stage !== 'master') {
		app.setDefaultRemovalPolicy('destroy')
	}

	app.setDefaultFunctionProps({
		runtime: 'nodejs16.x',
		logRetention: 'three_months',
		bundle: {
			format: 'esm'
		}
	})

	app.stack(ResourcesStack, { id: 'resources' })
	app.stack(ServiceApiStack, { id: 'serviceApi' })
	app.stack(AppApiStack, { id: 'appApi' })
	app.stack(FrontendStack, { id: 'frontend' })
}
