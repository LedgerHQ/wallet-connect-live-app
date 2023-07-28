describe('integration test that takes time', () => {
	it('Eventually works', async () => {
		const willResolveTrue = new Promise((resolve) =>
			setTimeout(() => resolve(true), 5000),
		)
		return await expect(willResolveTrue).resolves.toBe(false)
	})
})
