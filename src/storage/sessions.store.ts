import { SessionTypes } from "@walletconnect/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { StorageKeys } from "@/storage/types";
import { Web3WalletTypes } from "@walletconnect/web3wallet";

type Session = SessionTypes.Struct;

type Proposal = Web3WalletTypes.SessionProposal;

type SessionsState = {
  proposal?: Proposal;
  setProposal: (proposal: Proposal) => void;
  sessions: Session[];
  addSession: (session: Session) => void;
  addSessions: (sessions: Session[]) => void;
  removeSession: (sessionId: string) => void;
  clearSessions: () => void;
};

const removeSession = (state: SessionsState, sessionId: string): Session[] =>
  state.sessions.filter((session: Session) => session.topic !== sessionId);

const useSessionsStore = create<SessionsState>()(
  persist(
    (set) => ({
      proposal: undefined,
      setProposal: (proposal: Proposal) => set(() => ({ proposal })),
      sessions: [],
      addSession: (session) =>
        set((state) => ({ sessions: [...state.sessions, session] })),
      addSessions: (sessions) => set(() => ({ sessions: sessions })),
      clearSessions: () => set(() => ({ sessions: [] })),
      removeSession: (sessionId) =>
        set((state) => ({
          sessions: removeSession(state, sessionId),
        })),
    }),
    {
      name: StorageKeys.Sessions,
    }
  )
);

const sessionSelector = {
  selectProposal: (state: SessionsState) => state.proposal,
  setProposal: (state: SessionsState) => state.setProposal,
  selectSessions: (state: SessionsState) => state.sessions,
  addSession: (state: SessionsState) => state.addSession,
  addSessions: (state: SessionsState) => state.addSessions,
  removeSession: (state: SessionsState) => state.removeSession,
  clearSessions: (state: SessionsState) => state.clearSessions,
};

export { useSessionsStore, sessionSelector };
export type { Session };
