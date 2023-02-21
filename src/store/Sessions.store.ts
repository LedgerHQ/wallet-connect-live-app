import { SessionTypes } from '@walletconnect/types'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Session = SessionTypes.Struct

interface SessionsState {
	sessions: Session[]
	addSession: (session: Session) => void
	addSessions: (sessions: Session[]) => void
	removeSession: (sessionId: string) => void
	clearSessions: () => void
}

const useSessionsStore = create<SessionsState>()(
	persist(
		(set) => ({
			sessions: [],
			addSession: (session) =>
				set((state) => ({ sessions: [...state.sessions, session] })),
			addSessions: (sessions) => set(() => ({ sessions: sessions })),
			clearSessions: () => set(() => ({ sessions: [] })),
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
	addSession: (state: SessionsState) => state.addSession,
	addSessions: (state: SessionsState) => state.addSessions,
	removeSession: (state: SessionsState) => state.removeSession,
	clearSessions: (state: SessionsState) => state.clearSessions,
}

export { useSessionsStore, sessionSelector }
export type { Session }
