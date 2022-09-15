import { Auth } from 'aws-amplify'
import { Theme } from 'baseui'
import { Block } from 'baseui/block'
import { Button, ButtonProps } from 'baseui/button'
import { Card, StyledAction, StyledBody } from 'baseui/card'
import { Input } from 'baseui/input'
import { SnackbarProvider, useSnackbar } from 'baseui/snackbar'
import { useRouter } from 'next/router'
import React, { useState } from 'react'
import styled from 'styled-components'

const LogoImg = styled.img`
	width: 100%;
	margin-bottom: 50px;
`

const ButtonOverrides = { BaseButton: { style: { width: '100%' } } } as const

export const LoginChild: React.FC = () => {
	const [username, setUsername] = useState<string>('')
	const [password, setPassword] = useState<string>('')
	const router = useRouter()

	const { enqueue } = useSnackbar()

	const submit = async (): Promise<void> => {
		try {
			await Auth.signIn(username, password)
			if (username === 'admin') {
				router.push('/camera')
			} else {
				router.push('/')
			}
		} catch (err) {
			enqueue({
				message: (err as Error).message
			})
		}
	}

	return (
		<Block position="relative" width="40%" margin=" 50px auto 0 auto">
			<LogoImg src="/purple-logo.png" />
			<Card
				title="Serverless Parking Workshop"
				overrides={{ Root: { style: { width: '60%', margin: 'auto' } } }}
			>
				<StyledBody>
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
				</StyledBody>
				<StyledAction>
					<Button
						overrides={ButtonOverrides}
						size="compact"
						onClick={(): Promise<void> => submit()}
					>
						Login
					</Button>
					<Block marginTop="5px" />
					<Button
						overrides={ButtonOverrides}
						kind="tertiary"
						size="compact"
						href="/register"
						$as={(props: ButtonProps): JSX.Element => (
							// eslint-disable-next-line react/jsx-no-target-blank
							<a {...(props as JSX.IntrinsicElements['a'])} />
						)}
					>
						Register
					</Button>
				</StyledAction>
			</Card>
		</Block>
	)
}

export const Login: React.FC = () => {
	return (
		<SnackbarProvider
			placement="bottom"
			overrides={{
				Root: {
					style: ({ $theme }: { $theme: Theme }) => ({
						backgroundColor: $theme.colors.negative
					})
				}
			}}
		>
			<LoginChild />
		</SnackbarProvider>
	)
}
