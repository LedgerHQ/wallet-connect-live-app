import { SessionTypes } from '@walletconnect/types'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Session = SessionTypes.Struct

interface SessionsState {
	sessions: Session[]
	lastSessionVisited: Session | null
	addSession: (session: Session) => void
	addSessions: (sessions: Session[]) => void
	removeSession: (sessionId: string) => void
	clearSessions: () => void
	setLastSessionVisited: (session: Session | null) => void
}

const useSessionsStore = create<SessionsState>()(
	persist(
		(set) => ({
			sessions: [],
			lastSessionVisited: null,
			setLastSessionVisited: (session) =>
				set(() => ({ lastSessionVisited: session })),
			addSession: (session) =>
				set((state) => ({ sessions: [...state.sessions, session] })),
			addSessions: (sessions) => set(() => ({ sessions: sessions })),
			clearSessions: () =>
				set(() => ({ sessions: [], lastSessionVisited: null })),
			removeSession: (sessionId) =>
				set((state) => ({
					sessions: state.sessions.filter(
						(session: Session) => session.topic !== sessionId,
					),
				})),
		}),
		{
			name: 'sessions-storage',
		},
	),
)

const sessionSelector = {
	selectSessions: (state: SessionsState): Session[] => state.sessions,
	selectLastSession: (state: SessionsState): Session | null =>
		state.lastSessionVisited,
	addSession: (state: SessionsState) => state.addSession,
	addSessions: (state: SessionsState) => state.addSessions,
	removeSession: (state: SessionsState) => state.removeSession,
	clearSessions: (state: SessionsState) => state.clearSessions,
	setLastSessionVisited: (state: SessionsState) =>
		state.setLastSessionVisited,
}

export { useSessionsStore, sessionSelector }
export type { Session }
