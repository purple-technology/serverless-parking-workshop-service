import { App } from '@serverless-stack/resources'

import { AppApiStack } from './app-api'
import { FrontendStack } from './frontend'
import { IotStack } from './iot'
import { ResourcesStack } from './resources'
import { ServiceApiStack } from './service-api'
import { SpotLightsStack } from './spotLights'

export default function (app: App): void {
	if (app.stage !== 'master') {
		app.setDefaultRemovalPolicy('destroy')
	}

	app.setDefaultFunctionProps({
		runtime: 'nodejs16.x',
		logRetention: 'three_months',
		srcPath: 'services',
		bundle: {
			format: 'esm'
		}
	})

	app.stack(ResourcesStack, { id: 'resources' })
	app.stack(SpotLightsStack, { id: 'spotLights' })
	app.stack(ServiceApiStack, { id: 'serviceApi' })
	app.stack(AppApiStack, { id: 'appApi' })
	app.stack(FrontendStack, { id: 'frontend' })
	app.stack(IotStack, { id: 'iot' })
}
