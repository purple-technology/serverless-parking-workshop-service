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

export type Mutation = {
	__typename?: 'Mutation'
	allowEntry: Scalars['Boolean']
	reserveSpace: Scalars['Boolean']
}

export type MutationReserveSpaceArgs = {
	space: Scalars['ID']
	subject: Scalars['String']
	time?: InputMaybe<Scalars['Int']>
}

export type ParkingLot = {
	__typename?: 'ParkingLot'
	gateOpen: Scalars['Boolean']
	reservations: Array<Reservation>
	time: Scalars['String']
}

export type Query = {
	__typename?: 'Query'
	parkingLot: ParkingLot
	signedUrl: SignedUrl
}

export type Reservation = {
	__typename?: 'Reservation'
	creationTimestamp: Scalars['String']
	remainingTime?: Maybe<Scalars['Int']>
	space: Scalars['ID']
	subject: Scalars['String']
}

export type SignedUrl = {
	__typename?: 'SignedUrl'
	fields: Scalars['String']
	key: Scalars['String']
	url: Scalars['String']
}
