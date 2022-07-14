import {
	Auth,
	Bucket,
	Function,
	StackContext
} from '@serverless-stack/resources'
import { Fn } from 'aws-cdk-lib'
import { PolicyStatement } from 'aws-cdk-lib/aws-iam'

interface ResourcesStackOutput {
	auth: Auth
	photosBucket: Bucket
}

export function ResourcesStack({ stack }: StackContext): ResourcesStackOutput {
	stack.setDefaultFunctionProps({
		srcPath: 'services'
	})

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

	const rekognitionFunction = new Function(stack, 'RekognitionFunction', {
		handler: 'rekognition/src/processImage/index.handler',
		initialPolicy: [
			new PolicyStatement({
				actions: ['rekognition:DetectText'],
				resources: ['*']
			})
		]
	})

	const photosBucket = new Bucket(stack, 'Photos', {
		name: `${stack.stackName}.photos`,
		cors: [
			{
				allowedHeaders: ['*'],
				allowedMethods: ['PUT', 'POST'],
				allowedOrigins: ['*'],
				maxAge: '3000 seconds'
			}
		],
		notifications: {
			rekognition: {
				function: rekognitionFunction,
				events: ['object_created']
			}
		}
	})

	rekognitionFunction.attachPermissions([
		new PolicyStatement({
			actions: ['s3:GetObject'],
			resources: [Fn.join('', [photosBucket.bucketArn, '/*'])]
		})
	])

	return {
		auth,
		photosBucket
	}
}
