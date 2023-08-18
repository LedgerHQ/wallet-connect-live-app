import styled from "styled-components"
import dynamic from "next/dynamic"

const QrReader = dynamic(() => import("react-qr-reader"), { ssr: false })

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

export function QRScanner({ onQRScan }: QRScannerProps) {
  return (
    <QRScannerContainer data-testid="qr-scanner">
      <QrReader
        delay={500}
        onError={(error) => {
          if (!!error) {
            console.error(error)
          }
        }}
        onScan={(result) => {
          if (!!result) {
            onQRScan(result)
          }
        }}
        style={{ width: "100%" }}
        facingMode="environment"
        showViewFinder={false}
      />
    </QRScannerContainer>
  )
}
