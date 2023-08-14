import { readdirSync, statSync } from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const graphqlPath = path.join(
	path.dirname(fileURLToPath(import.meta.url)),
	'services/app-api/resolvers'
)

const typesFields = readdirSync(graphqlPath).reduce<
	{ type: string; field: string }[]
>(
	(acc, type) => [
		...acc,
		...readdirSync(path.join(graphqlPath, type))
			.filter(
				(field: string): boolean =>
					!statSync(path.join(graphqlPath, type, field)).isDirectory()
			)
			.map((file: string): string => file.replace('.ts', ''))
			.map((field) => ({
				type,
				field
			}))
	],
	[]
)

export const dataSources = typesFields.reduce(
	(acc, { type, field }) => ({
		...acc,
		[`${type} ${field}`]: `services/app-api/resolvers/${type}/${field}.handler`
	}),
	{}
)

export const resolvers = typesFields.reduce(
	(acc, { type, field }) => ({
		...acc,
		[`${type} ${field}`]: `${type} ${field}`
	}),
	{}
)
