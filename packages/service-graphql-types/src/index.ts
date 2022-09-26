export type Maybe<T> = T | null
export type InputMaybe<T> = Maybe<T>
export type Exact<T extends { [key: string]: unknown }> = {
	[K in keyof T]: T[K]
}
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
	[SubKey in K]?: Maybe<T[SubKey]>
}
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
	[SubKey in K]: Maybe<T[SubKey]>
}
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
	ID: string
	String: string
	Boolean: boolean
	Int: number
	Float: number
}

export enum Gate {
	Entry = 'Entry',
	Exit = 'Exit'
}

export type Mutation = {
	__typename?: 'Mutation'
	freeSpot: Void
	navigateToSpot: Void
	occupySpot: Void
	openGate: Void
}

export type MutationFreeSpotArgs = {
	spot: Scalars['ID']
}

export type MutationNavigateToSpotArgs = {
	spot: Scalars['ID']
}

export type MutationOccupySpotArgs = {
	spot: Scalars['ID']
	timeSeconds?: InputMaybe<Scalars['Int']>
}

export type MutationOpenGateArgs = {
	gate: Gate
}

export type Query = {
	__typename?: 'Query'
	spots: Array<Spot>
}

export type Spot = {
	__typename?: 'Spot'
	spot: Scalars['ID']
	status: SpotStatus
}

export enum SpotStatus {
	Off = 'Off',
	On = 'On'
}

export type Void = {
	__typename?: 'Void'
	success: Scalars['Boolean']
}
