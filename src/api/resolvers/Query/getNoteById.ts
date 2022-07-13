import { AppSyncResolverHandler } from 'aws-lambda'

export const handler: AppSyncResolverHandler<{}, {}> = async (event) => {
	console.log(JSON.stringify(event))

	return {
		id: '123',
		content: 'asda'
	}
}
