import styled from 'styled-components'
import { CSSTransition } from 'react-transition-group'
import { Button, ProgressLoader, Text } from '@ledgerhq/react-ui'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'next-i18next'

const PendingConnectionContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
`

const TimeoutContainer = styled.div`
	margin-top: 12px;
	display: flex;
	align-items: center;

	div {
		position: relative;
	}
`

export type PendingConnectionProps = {
	timeout: number
	onTimeout: () => void
	onCancel: () => void
}

export function PendingConnection({
	timeout,
	onTimeout,
	onCancel,
}: PendingConnectionProps) {
	const initialTime = useRef(Date.now())
	const [elapsedTime, setElapsedTime] = useState(0)
	const { t } = useTranslation()

	console.log({ elapsedTime })

	useEffect(() => {
		const interval = setInterval(() => {
			const elapsedTime = Date.now() - initialTime.current
			setElapsedTime(elapsedTime)

			if (elapsedTime > timeout) {
				onTimeout()
			}
		}, 500)

		return () => clearInterval(interval)
	}, [timeout])

	return (
		<CSSTransition
			classNames="fade"
			timeout={200}
			mountOnEnter
			in={elapsedTime > 1000}
		>
			<PendingConnectionContainer>
				<TimeoutContainer>
					<Text mr="12px" variant="h4">
						{t('connect.waiting')}
					</Text>
					<ProgressLoader
						radius={18}
						progress={(elapsedTime / timeout) * 100}
						stroke={7}
						showPercentage={false}
					/>
				</TimeoutContainer>
				<Button mt="12px" variant="error" outline onClick={onCancel}>
					<Text>{t('connect.cancel')}</Text>
				</Button>
			</PendingConnectionContainer>
		</CSSTransition>
	)
}
