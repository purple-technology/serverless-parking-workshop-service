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
	createNote?: Maybe<Note>
	deleteNote?: Maybe<Scalars['String']>
	updateNote?: Maybe<Note>
}

export type MutationCreateNoteArgs = {
	note: NoteInput
}

export type MutationDeleteNoteArgs = {
	noteId: Scalars['String']
}

export type MutationUpdateNoteArgs = {
	note: UpdateNoteInput
}

export type Note = {
	__typename?: 'Note'
	content: Scalars['String']
	id: Scalars['ID']
}

export type NoteInput = {
	content: Scalars['String']
	id: Scalars['ID']
}

export type Query = {
	__typename?: 'Query'
	getNoteById?: Maybe<Note>
	listNotes?: Maybe<Array<Maybe<Note>>>
}

export type QueryGetNoteByIdArgs = {
	noteId: Scalars['String']
}

export type UpdateNoteInput = {
	content?: InputMaybe<Scalars['String']>
	id: Scalars['ID']
}
