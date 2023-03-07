import styled from 'styled-components'
import dynamic from 'next/dynamic'

const QrReader = dynamic(() => import('react-qr-reader'), { ssr: false })

const QRScannerContainer = styled.div`
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	justify-content: center;
	overflow: hidden;
	position: relative;
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
	z-index: 2;
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

export function QRScanner({ onQRScan }: QRScannerProps) {
	return (
		<QRScannerContainer>
			<QrReader
				delay={500}
				onError={(error) => {
					if (!!error) {
						console.log(error)
					}
				}}
				onScan={(result) => {
					if (!!result) {
						onQRScan(result)
					}
				}}
				style={{
					objectFit: 'cover',
					objectPosition: 'center center',
					width: '100%',
					height: '100%',
				}}
				facingMode="environment"
				showViewFinder={false}
			/>
			<QRScannerOverlay />
		</QRScannerContainer>
	)
}
