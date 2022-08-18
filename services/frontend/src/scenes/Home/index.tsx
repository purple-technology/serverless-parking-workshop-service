import { CognitoUser } from '@aws-amplify/auth'
import { createGraphiQLFetcher } from '@graphiql/toolkit'
import { ApiKeyQuery } from '@packages/app-graphql-types'
import { useQuery } from '@tanstack/react-query'
import { API, Auth } from 'aws-amplify'
import { Spinner } from 'baseui/spinner'
import { Tab, Tabs } from 'baseui/tabs'
import GraphiQL from 'graphiql'
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

	const apiKeyQuery = useQuery(['apiKey'], async () => {
		const { data } = (await API.graphql({
			query: /* GraphQL */ `
				query ApiKey {
					api {
						key
					}
				}
			`
		})) as { data: ApiKeyQuery }
		return data
	})

	useEffect(() => {
		Auth.currentAuthenticatedUser()
			.then((user) => setUser(user))
			.catch(() => {
				router.push('/login')
			})
	}, [router])

	if (
		typeof user === 'undefined' ||
		typeof apiKeyQuery.data?.api.key === 'undefined'
	) {
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
			overrides={{
				Root: {
					style: {
						height: '100vh'
					}
				},
				TabContent: {
					style: {
						padding: '0',
						borderTop: 'solid 1px #cfd0d0',
						height: '100%'
					}
				}
			}}
		>
			<Tab title="GraphQL API">
				<GraphiQL
					headers={JSON.stringify(
						{
							'x-api-key': apiKeyQuery.data.api.key,
							'api-url': `${process.env.NEXT_PUBLIC_SERVICE_API_URL}`
						},
						null,
						2
					)}
					fetcher={createGraphiQLFetcher({
						url: `${process.env.NEXT_PUBLIC_SERVICE_API_URL}`
					})}
					editorTheme="codemirror"
				/>
			</Tab>
			<Tab title="AWS Settings">
				<div>AWS settings</div>
			</Tab>
			<Tab title="Amazon S3">
				<div>S3</div>
				<img
					src={`${process.env.NEXT_PUBLIC_S3_PHOTO_OBJECT_BASE_URL}/1.jpg`}
					alt="1.jpg"
				/>
			</Tab>
			<Tab title="Amazon EventBridge">
				<div>EventBridge</div>
			</Tab>
		</Tabs>
	)
}
