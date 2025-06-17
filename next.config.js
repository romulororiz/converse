const nextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'randomuser.me',
				pathname: '/api/portraits/**',
			},
			{
				protocol: 'https',
				hostname: 'covers.openlibrary.org',
			},
		],
	},
};

module.exports = nextConfig;
