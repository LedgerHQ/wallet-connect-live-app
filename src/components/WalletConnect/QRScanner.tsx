import styled from 'styled-components'
import { BrowserQRCodeReader, IScannerControls } from '@zxing/browser'
import { useLayoutEffect, useRef } from 'react'
import { Result } from '@zxing/library'

const QRScannerContainer = styled.div`
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	justify-content: center;
	overflow: hidden;
	position: relative;
`

const QRScannerVideoElement = styled.video`
	object-fit: cover;
	object-position: center center;
	width: 100%;
	height: 100%;
`

type QRScannerProps = {
	onQRScan: (data: string) => void
}

export function QRScanner({ onQRScan }: QRScannerProps) {
	const videoRef = useRef(null)

	useLayoutEffect(() => {
		const codeReader = new BrowserQRCodeReader(undefined, {
			delayBetweenScanAttempts: 500,
		})
		let controlsRef: IScannerControls | null = null

		if (!videoRef.current) {
			return
		}
		codeReader
			.decodeFromConstraints(
				{
					video: {
						facingMode: 'environment',
					},
				},
				videoRef.current,
				(result?: Result) => {
					if (result) {
						onQRScan(result.toString())
					}
				},
			)
			.then((controls) => {
				controlsRef = controls
			})

		return () => {
			if (controlsRef) {
				controlsRef.stop()
			}
		}
	}, [])

	return (
		<QRScannerContainer>
			<QRScannerVideoElement ref={videoRef} />
		</QRScannerContainer>
	)
}
