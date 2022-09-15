import { detailTypes, source } from './constants'

export type Source = typeof source

export type DetailType = typeof detailTypes[number]

export type BaseDetail = {
	targetUser: string
}
