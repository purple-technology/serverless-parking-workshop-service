import { BaseDetail, DetailType, Source } from './types'

type Template = {
	source: Source
	detailType: DetailType
	detail: BaseDetail
}

const gateOpened = (username: string): Template => ({
	source: 'parking-service',
	detailType: 'gate-opened',
	detail: {
		targetUser: username
	}
})

const gateClosed = (username: string): Template => ({
	source: 'parking-service',
	detailType: 'gate-closed',
	detail: {
		targetUser: username
	}
})

const reservationCreated = (username: string): Template => ({
	source: 'parking-service',
	detailType: 'reservation-created',
	detail: {
		targetUser: username
	}
})

const reservationExpired = (username: string): Template => ({
	source: 'parking-service',
	detailType: 'reservation-expired',
	detail: {
		targetUser: username
	}
})

export const templates: {
	readonly [key: string]: (username: string) => Template
} = {
	1: gateOpened,
	2: gateClosed,
	3: reservationCreated,
	4: reservationExpired
} as const
