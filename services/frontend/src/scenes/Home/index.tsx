import { CognitoUser } from '@aws-amplify/auth'
import { createGraphiQLFetcher } from '@graphiql/toolkit'
import {
	ApiKeyQuery,
	EventBusArnMutation,
	EventBusArnMutationVariables,
	S3BucketNameMutation,
	S3BucketNameMutationVariables
} from '@packages/app-graphql-types'
import { useMutation, useQuery } from '@tanstack/react-query'
import { API, Auth } from 'aws-amplify'
import { Button } from 'baseui/button'
import { Input } from 'baseui/input'
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
	const [activeTab, setActiveTab] = useState<string | number>('0')

	const [eventBusArn, setEventBusArn] = useState<string | undefined>()
	const [s3BucketName, setS3BucketName] = useState<string | undefined>()

	const router = useRouter()

	const apiKeyQuery = useQuery<ApiKeyQuery>(
		['apiKey'],
		async () => {
			const { data } = (await API.graphql({
				query: /* GraphQL */ `
					query ApiKey {
						api {
							key
						}
						config {
							eventBusArn
							s3BucketName
						}
					}
				`
			})) as { data: ApiKeyQuery }
			return data
		},
		{
			onSuccess: ({ config }) => {
				if (typeof eventBusArn === 'undefined') {
					setEventBusArn(config.eventBusArn ?? '')
				}
				if (typeof s3BucketName === 'undefined') {
					setS3BucketName(config.s3BucketName ?? '')
				}
			}
		}
	)

	const eventBusArnMutation = useMutation<
		EventBusArnMutation,
		unknown,
		EventBusArnMutationVariables
	>(['eventBusArn'], async (variables) => {
		const { data } = (await API.graphql({
			query: /* GraphQL */ `
				mutation EventBusArn($eventBusArn: String!) {
					setEventBusArn(eventBusArn: $eventBusArn) {
						success
					}
				}
			`,
			variables
		})) as { data: EventBusArnMutation }
		return data
	})

	const s3BucketNameMutation = useMutation<
		S3BucketNameMutation,
		unknown,
		S3BucketNameMutationVariables
	>(['s3BucketName'], async (variables) => {
		const { data } = (await API.graphql({
			query: /* GraphQL */ `
				mutation S3BucketName($s3BucketName: String!) {
					setS3BucketName(s3BucketName: $s3BucketName) {
						success
					}
				}
			`,
			variables
		})) as { data: S3BucketNameMutation }
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
			activeKey={activeTab}
			onChange={({ activeKey }): void => {
				setActiveTab(activeKey)
			}}
			overrides={{
				Root: {
					style: {
						height: '100vh'
					}
				},
				TabContent: {
					style: {
						paddingTop: '0',
						paddingLeft: '0',
						paddingRight: '0',
						paddingBottom: '0',
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
				<Input
					value={eventBusArn}
					onChange={(e): void => {
						setEventBusArn(e.currentTarget.value)
					}}
					placeholder="Event Bus Arn"
				/>
				<Button
					onClick={(): void => {
						eventBusArnMutation.mutate({ eventBusArn: eventBusArn ?? '' })
					}}
				>
					Set
				</Button>
				<Input
					value={s3BucketName}
					onChange={(e): void => {
						setS3BucketName(e.currentTarget.value)
					}}
					placeholder="S3 Bucket Name"
				/>
				<Button
					onClick={(): void => {
						s3BucketNameMutation.mutate({ s3BucketName: s3BucketName ?? '' })
					}}
				>
					Set
				</Button>
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
