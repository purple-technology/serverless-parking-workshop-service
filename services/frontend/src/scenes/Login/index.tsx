import { Auth } from 'aws-amplify'
import { Button } from 'baseui/button'
import { Input } from 'baseui/input'
import { SnackbarProvider, useSnackbar } from 'baseui/snackbar'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import styled from 'styled-components'

const Box = styled.div`
	position: relative;
	width: 25%;
	margin: 10px auto;
`

export const LoginChild: React.FC = () => {
	const [username, setUsername] = useState<string>('')
	const [password, setPassword] = useState<string>('')
	const router = useRouter()

	const { enqueue } = useSnackbar()

	const submit = async (): Promise<void> => {
		try {
			await Auth.signIn(username, password)
			router.push('/')
		} catch (err) {
			enqueue({
				message: (err as Error).message
			})
		}
	}

	return (
		<Box>
			<Input
				value={username}
				onChange={(e): void => setUsername(e.currentTarget.value)}
				placeholder="Username"
				clearOnEscape
			/>
			<Input
				value={password}
				onChange={(e): void => setPassword(e.currentTarget.value)}
				placeholder="Password"
				clearOnEscape
				type="password"
			/>
			<Button onClick={(): Promise<void> => submit()}>Login</Button>
			<Link href="/register">Register</Link>
		</Box>
	)
}

export const Login: React.FC = () => {
	return (
		<SnackbarProvider
			overrides={{
				Root: {
					style: {
						backgroundColor: 'red'
					}
				}
			}}
		>
			<LoginChild />
		</SnackbarProvider>
	)
}
