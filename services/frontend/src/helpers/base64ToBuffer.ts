export function base64ToBuffer(dataurl: string): Blob {
	const arr = dataurl.split(',')
	const match = arr[0].match(/:(.*?);/)

	if (match === null) {
		throw new Error('Invalid image format')
	}

	const mime = match[1]

	const bstr = atob(arr[1])
	let n = bstr.length
	const u8arr = new Uint8Array(n)

	while (n--) {
		u8arr[n] = bstr.charCodeAt(n)
	}
	return new Blob([u8arr], { type: mime })
}
