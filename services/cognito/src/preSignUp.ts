import { PreSignUpTriggerHandler } from 'aws-lambda'

export const handler: PreSignUpTriggerHandler = async (event) => {
	event.response = {
		autoConfirmUser: true,
		autoVerifyPhone: false,
		autoVerifyEmail: false
	}
	return event
}
