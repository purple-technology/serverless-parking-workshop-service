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

export type Config = {
	__typename?: 'Config'
	eventBusArn?: Maybe<Scalars['String']>
	s3BucketName?: Maybe<Scalars['String']>
}

export type Mutation = {
	__typename?: 'Mutation'
	copyS3Object: Void
	setEventBusArn?: Maybe<Void>
	setS3BucketName?: Maybe<Void>
}

export type MutationCopyS3ObjectArgs = {
	objectId: Scalars['ID']
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
}

export type Void = {
	__typename?: 'Void'
	success: Scalars['Boolean']
}

export type ApiKeyQueryVariables = Exact<{ [key: string]: never }>

export type ApiKeyQuery = {
	__typename?: 'Query'
	api: { __typename?: 'Api'; key: string }
}
