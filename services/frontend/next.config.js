/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	compiler: {
		styledComponents: true
	},
	experimental: {
		externalDir: true
	}
}

module.exports = nextConfig
