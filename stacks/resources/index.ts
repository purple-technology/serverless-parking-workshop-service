import { Auth, StackContext } from '@serverless-stack/resources'

interface ResourcesStackOutput {
	auth: Auth
}

export function ResourcesStack({ stack }: StackContext): ResourcesStackOutput {
	const auth = new Auth(stack, 'Auth', {
		login: ['email'],
		cdk: {
			userPool: {
				passwordPolicy: {
					minLength: 6,
					requireDigits: false,
					requireLowercase: false,
					requireSymbols: false,
					requireUppercase: false
				}
			}
		}
	})

	return {
		auth
	}
}
