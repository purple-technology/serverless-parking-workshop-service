import { StackContext } from '@serverless-stack/resources'
import { aws_iot as iot } from 'aws-cdk-lib'
import * as fs from 'fs'

interface IotStackOutput {}

const policyDocument = {
	Version: '2012-10-17',
	Statement: [
		{
			Effect: 'Allow',
			Action: 'iot:*',
			Resource: '*'
		}
	]
}

export function IotStack({ stack }: StackContext): IotStackOutput {
	stack.setDefaultFunctionProps({
		srcPath: 'services'
	})

	const csr = fs.readFileSync('./iot/certificate.pem.csr', 'utf8')

	const certificate = new iot.CfnCertificate(stack, 'M5StackCertificate', {
		status: 'ACTIVE',
		certificateSigningRequest: csr
	})

	stack.addOutputs({ certificateId: certificate.attrId })

	const policyName = `${stack.stackName}-iotPolicy`

	new iot.CfnPolicy(stack, 'M5StackPolicy', {
		policyDocument: policyDocument,
		policyName: policyName
	})

	new iot.CfnPolicyPrincipalAttachment(
		stack,
		'MyCfnPolicyCertificateAttachment',
		{
			policyName: policyName,
			principal: certificate.attrArn
		}
	)

	const thingName = `${stack.stackName}-M5StackCore2`

	new iot.CfnThing(stack, 'M5StackThing', {
		thingName: thingName
	})

	new iot.CfnThingPrincipalAttachment(
		stack,
		'M5StackThingCertificateAttachment',
		{
			principal: certificate.attrArn,
			thingName: thingName
		}
	)

	return {}
}
