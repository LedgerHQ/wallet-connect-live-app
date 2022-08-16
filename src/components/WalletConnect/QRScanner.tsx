import styled from 'styled-components'
import { BrowserQRCodeReader, IScannerControls } from '@zxing/browser'
import { useLayoutEffect, useRef } from 'react'
import { Result } from '@zxing/library'
import { Flex, Text } from '@ledgerhq/react-ui'

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
	width: 100%;
	height: 100%;
`

type QRScannerProps = {
	onQRScan: (data: string) => void
}

const QRScannerOverlay = styled.div`
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: black;
	opacity: 0.7;
	z-index: 1;
	clip-path: polygon(
		0% 0%,
		0% 100%,
		20% 100%,
		20% 20%,
		80% 20%,
		80% 80%,
		20% 80%,
		20% 100%,
		100% 100%,
		100% 0%
	);
`

const TopContainer = styled.div`
	position: absolute;
	top: 50px;
	left: 0;
	right: 0;
	z-index: 1;
	display: flex;
	padding: 0px 16px;
	align-items: center;
	justify-content: center;
`

export function QRScanner({ onQRScan }: QRScannerProps) {
	const videoRef = useRef(null)

	useLayoutEffect(() => {
		const codeReader = new BrowserQRCodeReader(undefined, { delayBetweenScanAttempts: 500 })
		let controlsRef: IScannerControls | null = null

        if (!videoRef.current) {
            return
        }
        codeReader.decodeFromConstraints(
            {
                video: {
                    facingMode: "environment"
                }
            },
            videoRef.current,
            (result?: Result) => {
                if (result) {
                    onQRScan(result.toString())
                }
            },
        ).then(controls => {
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
			<QRScannerOverlay />
			<TopContainer>
				<Flex>
					<Text variant="h4" textAlign="center">
						Scan a QR Code to connect
					</Text>
				</Flex>
			</TopContainer>
			<QRScannerVideoElement ref={videoRef} />
		</QRScannerContainer>
	)
}
