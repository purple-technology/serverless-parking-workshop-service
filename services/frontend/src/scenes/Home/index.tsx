import { CognitoUser } from '@aws-amplify/auth'
import { Auth } from 'aws-amplify'
import { Button } from 'baseui/button'
import { Spinner } from 'baseui/spinner'
import { Tab, Tabs } from 'baseui/tabs'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import styled from 'styled-components'

const Box = styled.div`
	position: relative;
	width: 25%;
	margin: 10px auto;
`

export const Home: React.FC = () => {
	const [user, setUser] = useState<CognitoUser | undefined>()
	const [activeKey, setActiveKey] = useState<string | number>('0')
	const router = useRouter()

	useEffect(() => {
		Auth.currentAuthenticatedUser()
			.then((user) => setUser(user))
			.catch(() => {
				router.push('/login')
			})
	}, [router])

	if (typeof user === 'undefined') {
		return (
			<Box>
				<Spinner />
			</Box>
		)
	}

	return (
		<Tabs
			activeKey={activeKey}
			onChange={({ activeKey }): void => {
				setActiveKey(activeKey)
			}}
		>
			<Tab title="Tab Link 1">
				<div>
					<Button
						onClick={async (): Promise<void> => {
							// const o = API.graphql({
							// 	query: `
							// 	`
							// }) as Promise<any>
						}}
					>
						Login
					</Button>
				</div>
			</Tab>
			<Tab title="Tab Link 2">
				<div>EventBridge</div>
			</Tab>
			<Tab title="Tab Link 3">
				<div>c</div>
			</Tab>
		</Tabs>
	)
}
