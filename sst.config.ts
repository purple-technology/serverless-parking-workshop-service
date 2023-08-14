import { getStage } from '@purple/serverless-git-branch-stage-plugin'
import type { SSTConfig } from 'sst'

import { AppApiStack } from './stacks/app-api'
import { FrontendStack } from './stacks/frontend'
import { IotStack } from './stacks/iot'
import { ResourcesStack } from './stacks/resources'
import { ServiceApiStack } from './stacks/service-api'
import { SpotLightsStack } from './stacks/spotLights'

const config: SSTConfig = {
	config() {
		const stage = getStage()

		return {
			name: 'slsws',
			region: 'eu-central-1',
			stage
		}
	},
	stacks(app) {
		if (app.stage !== 'master') {
			app.setDefaultRemovalPolicy('destroy')
		}

		app.setDefaultFunctionProps({
			runtime: 'nodejs16.x',
			architecture: 'arm_64',
			logRetention: 'three_months',
			nodejs: {
				format: 'esm'
			}
		})

		app
			.stack(ResourcesStack, { id: 'resources' })
			.stack(SpotLightsStack, { id: 'spotLights' })
			.stack(ServiceApiStack, { id: 'serviceApi' })
			.stack(AppApiStack, { id: 'appApi' })
			.stack(FrontendStack, { id: 'frontend' })
			.stack(IotStack, { id: 'iot' })
	}
}

export default config
