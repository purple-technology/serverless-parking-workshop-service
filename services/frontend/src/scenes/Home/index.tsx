import { GraphQLResult } from '@aws-amplify/api-graphql/lib-esm/types'
import { CognitoUser } from '@aws-amplify/auth'
import { createGraphiQLFetcher } from '@graphiql/toolkit'
import {
	ApiKeyQuery,
	Camera,
	CopyObjectMutation,
	CopyObjectMutationVariables,
	EventBusArnMutation,
	EventBusArnMutationVariables,
	MachineQuery,
	S3BucketNameMutation,
	S3BucketNameMutationVariables,
	SendEventMutation,
	SendEventMutationVariables,
	StartMachineMutation,
	StartMachineMutationVariables
} from '@packages/app-graphql-types'
import { templates } from '@packages/event-bus'
import { useMutation, useQuery } from '@tanstack/react-query'
import { API, Auth } from 'aws-amplify'
import { Theme } from 'baseui'
import { Block } from 'baseui/block'
import { Button } from 'baseui/button'
import { Card, StyledAction, StyledBody } from 'baseui/card'
import { FlexGrid, FlexGridItem } from 'baseui/flex-grid'
import { Input } from 'baseui/input'
import { Option, Select } from 'baseui/select'
import { DURATION, SnackbarProvider, useSnackbar } from 'baseui/snackbar'
import { Spinner } from 'baseui/spinner'
import { Tab, Tabs } from 'baseui/tabs-motion'
import { Textarea } from 'baseui/textarea'
import GraphiQL from 'graphiql'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import SyntaxHighlighter from 'react-syntax-highlighter'
import github from 'react-syntax-highlighter/dist/cjs/styles/hljs/github'
import styled from 'styled-components'

const cameraImageConfig: { [row: number]: Camera } = {
	0: Camera.Entrance,
	1: Camera.Exit,
	2: Camera.ParkingLot
}

const Box = styled.div`
	position: relative;
	width: 25%;
	margin: 10px auto;
`

const tabOverrides = {
	TabPanel: {
		style: {
			paddingTop: '0',
			paddingLeft: '0',
			paddingRight: '0',
			paddingBottom: '0',
			borderTop: 'solid 1px #cfd0d0',
			height: '100%'
		}
	}
} as const

const cardOverrides = {
	Root: {
		style: {
			width: '60%',
			margin: 'auto'
		}
	}
} as const

const snackbarNegativeOverrides = {
	Root: {
		style: ({ $theme }: { $theme: Theme }) => ({
			backgroundColor: $theme.colors.negative
		})
	}
} as const

const snackbarPositiveOverrides = {
	Root: {
		style: ({ $theme }: { $theme: Theme }) => ({
			backgroundColor: $theme.colors.positive
		})
	}
} as const

export const HomeChild: React.FC = () => {
	const [user, setUser] = useState<CognitoUser | undefined>()
	const [activeTab, setActiveTab] = useState<string | number>('0')

	// AWS Settings
	const [accessKeyId, setAccessKeyId] = useState<string>('ACCESS_KEY_ID_HERE')
	const [secretAccessKey, setSecretAccessKey] = useState<string>(
		'SECRET_ACCESS_KEY_HERE'
	)
	const [sessionToken, setSessionToken] = useState<string>('SESSION_TOKEN_HERE')
	const [eventBusArn, setEventBusArn] = useState<string | undefined>()
	const [s3BucketName, setS3BucketName] = useState<string | undefined>()

	// S3
	const [s3SelectedImage, setS3SelectedImage] = useState<string>('1')
	const s3ImageOnClick = (imageId: string) => () => setS3SelectedImage(imageId)

	// EventBridge
	const [eventSelectValue, setEventSelectValue] = useState<Option | undefined>()

	const router = useRouter()

	const { enqueue } = useSnackbar()

	const machineQuery = useQuery<MachineQuery>(['machine'], async () => {
		const { data } = (await API.graphql({
			query: /* GraphQL */ `
				query Machine {
					config {
						isMachineRunning
						machineAddress
					}
				}
			`
		})) as { data: MachineQuery }
		return data
	})

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
							isMachineRunning
							machineAddress
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

	const startMachineMutation = useMutation<
		StartMachineMutation,
		GraphQLResult<StartMachineMutation>,
		StartMachineMutationVariables
	>(
		['startMachine'],
		async (variables) => {
			const { data } = (await API.graphql({
				query: /* GraphQL */ `
					mutation StartMachine(
						$accessKeyId: String!
						$secretAccessKey: String!
						$sessionToken: String!
					) {
						startMachine(
							accessKeyId: $accessKeyId
							secretAccessKey: $secretAccessKey
							sessionToken: $sessionToken
						) {
							success
						}
					}
				`,
				variables
			})) as { data: StartMachineMutation }
			return data
		},
		{
			onError: ({ errors }) => {
				const error = (errors ?? [])[0]
				enqueue(
					{
						message: `Error: ${error.message}`,
						overrides: snackbarNegativeOverrides
					},
					DURATION.long
				)
			},
			onSuccess: () => {
				enqueue(
					{
						message: 'Machine is starting...',
						overrides: snackbarPositiveOverrides
					},
					DURATION.short
				)
			}
		}
	)

	const eventBusArnMutation = useMutation<
		EventBusArnMutation,
		GraphQLResult<EventBusArnMutation>,
		EventBusArnMutationVariables
	>(
		['eventBusArn'],
		async (variables) => {
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
		},
		{
			onError: ({ errors }) => {
				const error = (errors ?? [])[0]
				enqueue(
					{
						message: `Error: ${error.message}`,
						overrides: snackbarNegativeOverrides
					},
					DURATION.long
				)
			},
			onSuccess: () => {
				enqueue(
					{
						message: 'Event Bus ARN saved.',
						overrides: snackbarPositiveOverrides
					},
					DURATION.short
				)
			}
		}
	)

	const s3BucketNameMutation = useMutation<
		S3BucketNameMutation,
		GraphQLResult<S3BucketNameMutation>,
		S3BucketNameMutationVariables
	>(
		['s3BucketName'],
		async (variables) => {
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
		},
		{
			onError: ({ errors }) => {
				const error = (errors ?? [])[0]
				enqueue(
					{
						message: `Error: ${error.message}`,
						overrides: snackbarNegativeOverrides
					},
					DURATION.long
				)
			},
			onSuccess: () => {
				enqueue(
					{
						message: 'S3 Bucket Name saved.',
						overrides: snackbarPositiveOverrides
					},
					DURATION.short
				)
			}
		}
	)

	const copyS3ObjectMutation = useMutation<
		CopyObjectMutation,
		GraphQLResult<CopyObjectMutation>,
		CopyObjectMutationVariables
	>(
		['copyObject'],
		async (variables) => {
			const { data } = (await API.graphql({
				query: /* GraphQL */ `
					mutation CopyObject($objectId: ID!) {
						copyS3Object(objectId: $objectId) {
							success
						}
					}
				`,
				variables
			})) as { data: CopyObjectMutation }
			return data
		},
		{
			onError: ({ errors }) => {
				const error = (errors ?? [])[0]
				enqueue(
					{
						message: `Error: ${error.message}`,
						overrides: snackbarNegativeOverrides
					},
					DURATION.long
				)
			},
			onSuccess: () => {
				enqueue(
					{
						message: 'Event sent.',
						overrides: snackbarPositiveOverrides
					},
					DURATION.short
				)
			}
		}
	)

	const sendEventMutation = useMutation<
		SendEventMutation,
		GraphQLResult<SendEventMutation>,
		SendEventMutationVariables
	>(
		['sendEvent'],
		async (variables) => {
			const { data } = (await API.graphql({
				query: /* GraphQL */ `
					mutation SendEvent($eventId: ID!) {
						sendEvent(eventId: $eventId) {
							success
						}
					}
				`,
				variables
			})) as { data: SendEventMutation }
			return data
		},
		{
			onError: ({ errors }) => {
				const error = (errors ?? [])[0]
				enqueue(
					{
						message: `Error: ${error.message}`,
						overrides: snackbarNegativeOverrides
					},
					DURATION.long
				)
			},
			onSuccess: () => {
				enqueue(
					{
						message: 'Event sent.',
						overrides: snackbarPositiveOverrides
					},
					DURATION.short
				)
			}
		}
	)

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
			renderAll
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
				TabList: {
					style: {
						backgroundColor: '#FFFFFF'
					}
				}
			}}
		>
			<Tab title="GraphQL API" overrides={tabOverrides}>
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
			<Tab title="AWS Settings" overrides={tabOverrides}>
				<Block marginTop="20px" />
				{machineQuery.isLoading ? (
					<Card title="VS Code Server Host" overrides={cardOverrides}>
						<StyledBody>Loading...</StyledBody>
					</Card>
				) : machineQuery.data?.config.isMachineRunning === true ? (
					<Card title="VS Code Server Host" overrides={cardOverrides}>
						<StyledBody>
							<Input
								value={
									typeof machineQuery.data?.config.machineAddress === 'string'
										? `ubuntu@${machineQuery.data?.config.machineAddress}`
										: machineQuery.isFetching
										? 'Fetching...'
										: 'Instance is preparing...'
								}
							/>
						</StyledBody>
						<StyledAction>
							<Button
								onClick={(): void => {
									machineQuery.refetch()
								}}
								size="compact"
							>
								Reload
							</Button>
						</StyledAction>
					</Card>
				) : (
					<Card
						title="Start VS Code development machine"
						overrides={cardOverrides}
					>
						<StyledBody>
							<Textarea
								overrides={{
									Input: {
										props: {
											onPaste: (event: ClipboardEvent) => {
												const newData = (
													event.clipboardData?.getData('text') as string
												)
													?.replace(/export(\ )?/gi, '')
													?.split('\n')
													?.reduce(
														(acc, row) => {
															const [key, value] = row.trim().split('=')
															const cleanKey = key?.trim()
															const cleanValue = value?.replaceAll('"', '')

															switch (cleanKey) {
																case 'AWS_ACCESS_KEY_ID':
																	acc.accessKeyId = cleanValue
																	break
																case 'AWS_SECRET_ACCESS_KEY':
																	acc.secretAccessKey = cleanValue
																	break
																case 'AWS_SESSION_TOKEN':
																	acc.sessionToken = cleanValue
																	break
															}

															return acc
														},
														{
															accessKeyId: accessKeyId,
															secretAccessKey: secretAccessKey,
															sessionToken: sessionToken
														}
													)

												setAccessKeyId(newData.accessKeyId)
												setSecretAccessKey(newData.secretAccessKey)
												setSessionToken(newData.sessionToken)
											}
										}
									}
								}}
								value={`export AWS_ACCESS_KEY_ID="${accessKeyId}"
export AWS_SECRET_ACCESS_KEY="${secretAccessKey}"
export AWS_SESSION_TOKEN="${sessionToken}"`}
								rows={6}
								clearOnEscape
							/>
						</StyledBody>
						<StyledAction>
							<Button
								disabled={
									accessKeyId.length < 5 ||
									secretAccessKey.length < 5 ||
									sessionToken.length < 5 ||
									accessKeyId === 'ACCESS_KEY_ID_HERE' ||
									secretAccessKey === 'SESSION_TOKEN_HERE' ||
									sessionToken === 'SECRET_ACCESS_KEY_HERE'
								}
								onClick={async (): Promise<void> => {
									await startMachineMutation.mutateAsync({
										accessKeyId,
										secretAccessKey,
										sessionToken
									})
									machineQuery.refetch()
								}}
								size="compact"
							>
								Start machine
							</Button>
						</StyledAction>
					</Card>
				)}

				<Block marginTop="20px" />
				<Card title="Amazon EventBridge ARN" overrides={cardOverrides}>
					<StyledBody>
						<Input
							value={eventBusArn ?? ''}
							onChange={(e): void => setEventBusArn(e.currentTarget.value)}
							placeholder="arn:aws:events:eu-central-1:000000000000:event-bus/some-event-bus-name"
						/>
					</StyledBody>
					<StyledAction>
						<Button
							onClick={(): void =>
								eventBusArnMutation.mutate({
									eventBusArn: eventBusArn ?? ''
								})
							}
							size="compact"
						>
							Save
						</Button>
					</StyledAction>
				</Card>
				<Block marginTop="20px" />
				<Card title="Amazon S3 Bucket Name" overrides={cardOverrides}>
					<StyledBody>
						<Input
							value={s3BucketName ?? ''}
							onChange={(e): void => setS3BucketName(e.currentTarget.value)}
							placeholder="some-photos-bucket-name-here"
						/>
					</StyledBody>
					<StyledAction>
						<Button
							onClick={(): void =>
								s3BucketNameMutation.mutate({
									s3BucketName: s3BucketName ?? ''
								})
							}
							size="compact"
						>
							Save
						</Button>
					</StyledAction>
				</Card>
			</Tab>
			<Tab title="Amazon S3" overrides={tabOverrides}>
				<Block $style={{ textAlign: 'center' }} paddingTop="20px">
					<Button
						onClick={(): void => {
							copyS3ObjectMutation.mutate({ objectId: s3SelectedImage })
						}}
					>
						Upload selected image
					</Button>
					<Block>
						Camera:{' '}
						{cameraImageConfig[Math.floor((Number(s3SelectedImage) - 1) / 2)]}
					</Block>
				</Block>
				<FlexGrid
					flexGridColumnCount={2}
					justifyContent="center"
					flexGridColumnGap="scale500"
					flexGridRowGap="scale800"
					padding="20px"
				>
					{['1', '2', '3', '4', '5', '6'].map((id, i) => (
						<FlexGridItem
							key={id}
							display="flex"
							alignItems="center"
							justifyContent={i % 2 === 0 ? 'right' : 'left'}
						>
							<img
								src={`${process.env.NEXT_PUBLIC_S3_PHOTO_OBJECT_BASE_URL}/${id}.jpg`}
								alt={`${id}.jpg`}
								onClick={s3ImageOnClick(id)}
								style={{
									maxHeight: '30vmin',
									maxWidth: '30vmin',
									cursor: 'pointer',
									borderRadius: '0.5em',
									border: `solid 5px ${
										s3SelectedImage === id ? '#3a3a3a' : '#e2e2e2'
									}`
								}}
							/>
						</FlexGridItem>
					))}
				</FlexGrid>
			</Tab>
			<Tab title="Amazon EventBridge" overrides={tabOverrides}>
				<Block marginTop="20px" />
				<Card title="Mock EventBridge Event" overrides={cardOverrides}>
					<StyledBody>
						<Select
							options={[
								{ label: 'Entry gate opened', id: '1' },
								{ label: 'Exit gate opened', id: '2' },
								{ label: 'Spot expired', id: '3' }
							]}
							value={eventSelectValue ? [eventSelectValue] : []}
							placeholder="Choose event"
							onChange={(params): void => {
								if (params.type === 'select') {
									setEventSelectValue(params.value[0])
								}
							}}
						/>
						<SyntaxHighlighter language="javascript" style={github}>
							{typeof eventSelectValue !== 'undefined'
								? JSON.stringify(
										templates[`${eventSelectValue.id}`](user.getUsername()),
										null,
										2
								  )
								: 'Select event...'}
						</SyntaxHighlighter>
					</StyledBody>
					<StyledAction>
						<Button
							disabled={typeof eventSelectValue === 'undefined'}
							onClick={(): void => {
								sendEventMutation.mutate({ eventId: `${eventSelectValue?.id}` })
							}}
						>
							Send Event
						</Button>
					</StyledAction>
				</Card>
			</Tab>
		</Tabs>
	)
}

export const Home: React.FC = () => (
	<SnackbarProvider placement="bottom">
		<HomeChild />
	</SnackbarProvider>
)
