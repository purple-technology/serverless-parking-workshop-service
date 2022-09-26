import { BaseDetail, DetailType, Source } from './types'

type Template = {
	source: Source
	detailType: DetailType
	detail: BaseDetail & Record<string, string | number>
}

const entryGateOpened = (username: string): Template => ({
	source: 'parking-service',
	detailType: 'gate-opened',
	detail: {
		targetUser: username,
		gate: 'entry'
	}
})

const exitGateOpened = (username: string): Template => ({
	source: 'parking-service',
	detailType: 'gate-opened',
	detail: {
		targetUser: username,
		gate: 'exit'
	}
})

const spotExpired = (username: string): Template => ({
	source: 'parking-service',
	detailType: 'spot-expired',
	detail: {
		targetUser: username,
		spotNumber: 4
	}
})

export const templates: {
	readonly [key: string]: (username: string) => Template
} = {
	1: entryGateOpened,
	2: exitGateOpened,
	3: spotExpired
} as const
