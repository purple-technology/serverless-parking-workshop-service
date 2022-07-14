import { API, Auth } from 'aws-amplify'
import { base64ToBuffer } from 'helpers/base64ToBuffer'
import { useEffect, useRef, useState } from 'react'
import { Camera, CameraType } from 'react-camera-pro'
import styled from 'styled-components'

const Box = styled.div`
	position: relative;
	width: 500px;
	height: 500px;
`

export const Hello: React.FC = () => {
	const camera = useRef<CameraType>()
	const [image, setImage] = useState<string>('')

	useEffect(() => {
		try {
			Auth.signIn('fpyrek@purple-technology.com', 'heslo123')
				.then((a) => console.log(a))
				.catch((err) => console.log(err))
		} catch (e) {}
	}, [])

	return (
		<div>
			<Box>
				<Camera
					ref={camera}
					errorMessages={{
						canvas: 'a',
						noCameraAccessible: 'b',
						permissionDenied: 'c',
						switchCamera: 'd'
					}}
				/>
			</Box>
			<button
				onClick={async (): Promise<void> => {
					const image = camera.current?.takePhoto() ?? ''
					setImage(image)

					const file = base64ToBuffer(image)

					const { data } = (await API.graphql({
						query: `
					query MyQuery {
						signedUrl {
							key
							url
							fields
						}
					}					
					`
					})) as unknown as {
						data: { signedUrl: { fields: string; key: string; url: string } }
					}

					const signedUrlFields = JSON.parse(data.signedUrl.fields)

					signedUrlFields['Content-Type'] = 'image/jpeg'

					const body = new FormData()

					const conditionKey = JSON.parse(
						Buffer.from(signedUrlFields.Policy, 'base64')?.toString('utf-8')
					)?.conditions?.find(
						(condition: string[]) =>
							Array.isArray(condition) && condition[1] === '$key'
					)[2]

					body.append('key', conditionKey)
					Object.keys(signedUrlFields).forEach((key) => {
						body.append(key, signedUrlFields[key])
					})
					body.append('file', file)

					fetch(
						new Request(data.signedUrl.url, {
							method: 'POST',
							body
						})
					)
						.then(async (res) => {
							if (res.status >= 200 && res.status < 300) {
								console.log('donee')
							}
						})
						.catch((err) => console.error(err))
				}}
			>
				Take photo
			</button>
			<img src={image} alt="Taken photo" />
		</div>
	)
}
