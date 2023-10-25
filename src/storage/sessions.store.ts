import { SessionTypes } from "@walletconnect/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { StorageKeys } from "@/storage/types";
type Session = SessionTypes.Struct;

interface SessionsState {
  sessions: Session[];
  addSession: (session: Session) => void;
  addSessions: (sessions: Session[]) => void;
  removeSession: (sessionId: string) => void;
  clearSessions: () => void;
}

const removeSession = (state: SessionsState, sessionId: string): Session[] =>
  state.sessions.filter((session: Session) => session.topic !== sessionId);

const useSessionsStore = create<SessionsState>()(
  persist(
    (set) => ({
      sessions: [],
      addSession: (session) => set((state) => ({ sessions: [...state.sessions, session] })),
      addSessions: (sessions) => set(() => ({ sessions: sessions })),
      clearSessions: () => set(() => ({ sessions: [] })),
      removeSession: (sessionId) =>
        set((state) => ({
          sessions: removeSession(state, sessionId),
        })),
    }),
    {
      name: StorageKeys.Sessions,
    },
  ),
);

const sessionSelector = {
  selectSessions: (state: SessionsState): Session[] => state.sessions,
  addSession: (state: SessionsState) => state.addSession,
  addSessions: (state: SessionsState) => state.addSessions,
  removeSession: (state: SessionsState) => state.removeSession,
  clearSessions: (state: SessionsState) => state.clearSessions,
};

export { useSessionsStore, sessionSelector };
export type { Session };
