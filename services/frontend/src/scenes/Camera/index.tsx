import { CognitoUser } from '@aws-amplify/auth'
import {
	Camera as CameraGQLType,
	PhotoSignedUrlQuery,
	PhotoSignedUrlQueryVariables
} from '@packages/app-graphql-types'
import { API, Auth } from 'aws-amplify'
import { Block } from 'baseui/block'
import { Card, StyledAction, StyledBody } from 'baseui/card'
import { Select } from 'baseui/select'
import { Slider } from 'baseui/slider'
import { Spinner } from 'baseui/spinner'
import { base64ToBuffer } from 'helpers/base64ToBuffer'
import Jimp from 'jimp'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Camera, CameraType } from 'react-camera-pro'
import styled from 'styled-components'

const Box = styled.div`
	position: relative;
	width: 25%;
	margin: 10px auto;
`

const SmallBox = styled.div`
	width: 115.2vmin;
	height: 64.8vmin;
	position: relative;
	margin: auto;
	border: solid 2px #e2e2e2;
	overflow: hidden;
`

const Emoji = styled.span`
	font-size: 30px;
`

const StatusBox = styled.div`
	text-align: center;
`

export const CameraScene: React.FC = () => {
	const camera = useRef<CameraType>()
	const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
	const [activeDevice, setActiveDevice] = useState<MediaDeviceInfo | undefined>(
		undefined
	)
	const [user, setUser] = useState<CognitoUser | undefined>()

	useEffect(() => {
		;(async (): Promise<void> => {
			const devices = await navigator.mediaDevices.enumerateDevices()
			const videoDevices = devices.filter((i) => i.kind == 'videoinput')
			setDevices(videoDevices)
			setActiveDevice(videoDevices[0])
		})()
	}, [])

	const [selectedCamera, setSelectedCamera] = useState<
		CameraGQLType | undefined
	>()

	const [captureState, setCaptureState] = useState<
		'disabled' | 'waiting' | 'captured' | 'uploading'
	>('waiting')

	const [distanceThreshold, setDistanceThreshold] = useState<number>(0.15)

	const router = useRouter()

	const query = async (
		variables: PhotoSignedUrlQueryVariables
	): Promise<PhotoSignedUrlQuery> => {
		const { data } = (await API.graphql({
			query: /* GraphQL */ `
				query PhotoSignedUrl($camera: Camera!) {
					photoSignedUrl(camera: $camera) {
						url
						key
						fields
					}
				}
			`,
			variables
		})) as { data: PhotoSignedUrlQuery }
		return data
	}

	const sendImage = useCallback(
		async (image: string, camera: CameraGQLType) => {
			const file = base64ToBuffer(image)

			const data = await query({ camera })

			const signedUrlFields = JSON.parse(data.photoSignedUrl.fields)
			signedUrlFields['Content-Type'] = 'image/jpeg'
			const conditionKey = JSON.parse(
				Buffer.from(signedUrlFields.Policy, 'base64')?.toString('utf-8')
			)?.conditions?.find(
				(condition: string[]) =>
					Array.isArray(condition) && condition[1] === '$key'
			)[2]

			const body = new FormData()
			body.append('key', conditionKey)
			Object.keys(signedUrlFields).forEach((key) => {
				body.append(key, signedUrlFields[key])
			})
			body.append('file', file)

			try {
				const res = await fetch(
					new Request(data.photoSignedUrl.url, {
						method: 'POST',
						body
					})
				)

				if (res.status >= 200 && res.status < 300) {
					console.info('Picure uploaded')
				}
			} catch (err) {
				console.error(err)
			}
		},
		[]
	)

	useEffect(() => {
		let lastImage: string | null = null
		var matchCounter: number = 0

		const interval = setInterval(async () => {
			if (
				typeof camera.current === 'undefined' ||
				typeof selectedCamera === 'undefined'
			) {
				matchCounter = 0
				return
			}

			const image = camera.current.takePhoto()

			if (lastImage === null) {
				lastImage = image
				return
			}

			const distance = Jimp.distance(
				await Jimp.read(lastImage),
				await Jimp.read(image)
			)

			if (distance > distanceThreshold) {
				setCaptureState('waiting')
				matchCounter = 0
			}

			matchCounter++

			if (matchCounter === 5) {
				setCaptureState('uploading')
				await sendImage(image, selectedCamera)
				setCaptureState('captured')
			}

			lastImage = image
		}, 500)

		return () => {
			setCaptureState('waiting')
			clearInterval(interval)
			console.log('unmounting')
		}
	}, [selectedCamera, camera, sendImage, setCaptureState, distanceThreshold])

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
		<Card
			overrides={{
				Root: {
					style: {
						width: '130vmin',
						margin: '5vmin auto auto auto'
					}
				}
			}}
		>
			<StyledBody>
				<SmallBox>
					<Camera
						facingMode="environment"
						ref={camera}
						aspectRatio={16 / 9}
						videoSourceDeviceId={activeDevice?.deviceId}
						errorMessages={{
							noCameraAccessible:
								'No camera device accessible. Please connect your camera or try a different browser.',
							permissionDenied:
								'Permission denied. Please refresh and give camera permission.',
							switchCamera:
								'It is not possible to switch camera to different one because there is only one video device accessible.',
							canvas: 'Canvas is not supported.'
						}}
					/>
				</SmallBox>
			</StyledBody>
			<StyledAction>
				<StatusBox>
					<Emoji>
						{typeof selectedCamera === 'undefined' ? (
							'📵 Capturing disabled'
						) : (
							<>
								{captureState === 'waiting' ? '👁 Waiting to stabilize...' : ''}
								{captureState === 'uploading' ? '🛫 Uploading...' : ''}
								{captureState === 'captured' ? '✅ Uploaded' : ''}
							</>
						)}
					</Emoji>
				</StatusBox>
				<Block height="10px" />
				<Select
					clearable={false}
					options={devices.map(({ deviceId, label }) => ({
						label: label,
						id: deviceId
					}))}
					value={typeof activeDevice === 'undefined' ? [] : [activeDevice]}
					placeholder="Select webcam source device"
					onChange={(params): void =>
						setActiveDevice(
							devices.find(({ deviceId }) => deviceId === params.value[0].id)
						)
					}
				/>
				<Block height="10px" />
				<Select
					options={Object.values(CameraGQLType).map((cameraType) => ({
						label: cameraType,
						id: cameraType
					}))}
					value={
						typeof selectedCamera === 'undefined'
							? []
							: [{ label: selectedCamera, id: selectedCamera }]
					}
					placeholder="Select camera type"
					onChange={(params): void =>
						setSelectedCamera(
							params.type === 'clear'
								? undefined
								: (params.value[0].id as CameraGQLType)
						)
					}
				/>

				<Slider
					min={0}
					max={0.5}
					step={0.025}
					value={[distanceThreshold]}
					onChange={({ value }): void => setDistanceThreshold(value[0])}
				/>
			</StyledAction>
		</Card>
	)
}
