/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	compiler: {
		styledComponents: true
	},
	experimental: {
		externalDir: true
	},
	webpack: (config) => {
		// Because of "jimp" package
		config.resolve.fallback = { fs: false }

		return config
	}
}

module.exports = nextConfig
