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
	cancelReservation: Void
	openGate: Void
	reserveSpot: Void
}

export type MutationCancelReservationArgs = {
	spot: Scalars['ID']
	subject: Scalars['String']
}

export type MutationOpenGateArgs = {
	gate: Gate
}

export type MutationReserveSpotArgs = {
	spot: Scalars['ID']
	subject: Scalars['String']
	timeSeconds: Scalars['Int']
}

export type ParkingLot = {
	__typename?: 'ParkingLot'
	reservations: Array<Reservation>
	time: Scalars['String']
}

export type Query = {
	__typename?: 'Query'
	parkingLot: ParkingLot
}

export type Reservation = {
	__typename?: 'Reservation'
	creationTimestamp: Scalars['String']
	expirationTimestamp: Scalars['String']
	spot: Scalars['ID']
	subject: Scalars['String']
}

export type Void = {
	__typename?: 'Void'
	success: Scalars['Boolean']
}
