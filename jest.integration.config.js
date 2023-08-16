const baseJestConfig = require('./jest.config')

module.exports = {
	...baseJestConfig,
	testMatch: ['**/__tests__/**/*.integration.test.ts'],
}
