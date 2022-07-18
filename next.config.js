/* eslint-disable @typescript-eslint/no-var-requires */
/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
	enabled: process.env.ANALYZE === 'true',
})

const { i18n } = require('./next-i18next.config')

const nextConfig = {
	i18n,
	eslint: {
		dirs: ['src'],
	},
}

module.exports = withBundleAnalyzer(nextConfig)
