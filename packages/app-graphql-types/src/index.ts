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

export type Api = {
	__typename?: 'Api'
	key: Scalars['String']
}

export enum Camera {
	Entrance = 'Entrance',
	Exit = 'Exit',
	ParkingLot = 'ParkingLot'
}

export type Config = {
	__typename?: 'Config'
	eventBusArn?: Maybe<Scalars['String']>
	s3BucketName?: Maybe<Scalars['String']>
}

export type Mutation = {
	__typename?: 'Mutation'
	copyS3Object: Void
	sendEvent: Void
	setEventBusArn?: Maybe<Void>
	setS3BucketName?: Maybe<Void>
}

export type MutationCopyS3ObjectArgs = {
	objectId: Scalars['ID']
}

export type MutationSendEventArgs = {
	eventId: Scalars['ID']
}

export type MutationSetEventBusArnArgs = {
	eventBusArn: Scalars['String']
}

export type MutationSetS3BucketNameArgs = {
	s3BucketName: Scalars['String']
}

export type Query = {
	__typename?: 'Query'
	api: Api
	config: Config
	photoSignedUrl: SignedUrl
}

export type QueryPhotoSignedUrlArgs = {
	camera: Camera
}

export type SignedUrl = {
	__typename?: 'SignedUrl'
	fields: Scalars['String']
	key: Scalars['String']
	url: Scalars['String']
}

export type Void = {
	__typename?: 'Void'
	success: Scalars['Boolean']
}

export type PhotoSignedUrlQueryVariables = Exact<{
	camera: Camera
}>

export type PhotoSignedUrlQuery = {
	__typename?: 'Query'
	photoSignedUrl: {
		__typename?: 'SignedUrl'
		url: string
		key: string
		fields: string
	}
}

export type ApiKeyQueryVariables = Exact<{ [key: string]: never }>

export type ApiKeyQuery = {
	__typename?: 'Query'
	api: { __typename?: 'Api'; key: string }
	config: {
		__typename?: 'Config'
		eventBusArn?: string | null
		s3BucketName?: string | null
	}
}

export type EventBusArnMutationVariables = Exact<{
	eventBusArn: Scalars['String']
}>

export type EventBusArnMutation = {
	__typename?: 'Mutation'
	setEventBusArn?: { __typename?: 'Void'; success: boolean } | null
}

export type S3BucketNameMutationVariables = Exact<{
	s3BucketName: Scalars['String']
}>

export type S3BucketNameMutation = {
	__typename?: 'Mutation'
	setS3BucketName?: { __typename?: 'Void'; success: boolean } | null
}

export type CopyObjectMutationVariables = Exact<{
	objectId: Scalars['ID']
}>

export type CopyObjectMutation = {
	__typename?: 'Mutation'
	copyS3Object: { __typename?: 'Void'; success: boolean }
}

export type SendEventMutationVariables = Exact<{
	eventId: Scalars['ID']
}>

export type SendEventMutation = {
	__typename?: 'Mutation'
	sendEvent: { __typename?: 'Void'; success: boolean }
}
