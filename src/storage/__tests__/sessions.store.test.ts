import { act, renderHook } from "@testing-library/react";

import { useSessionsStore } from "../sessions.store";
import { SESSION_MOCK } from "@/tests-tools/mocks/session.mock";

describe("Sessions Store", () => {
  it("Should have initial state ok", () => {
    const { result } = renderHook(() => useSessionsStore());
    const { sessions, lastSessionVisited } = result.current;

    expect(lastSessionVisited).toBeNull();
    expect(sessions).toEqual([]);
  });

  it("should setLastSessionVisited", async () => {
    const { result } = renderHook(() => useSessionsStore());

    act(() => result.current.setLastSessionVisited(SESSION_MOCK));
    expect(result.current.lastSessionVisited).not.toBeNull();
  });
  it("should add Sessions and remove One session and finally", () => {
    const { result } = renderHook(() => useSessionsStore());

    act(() => result.current.addSession(SESSION_MOCK));
    expect(result.current.sessions.length).toEqual(1);
    act(() => result.current.addSession({ ...SESSION_MOCK, topic: "12345" }));
    expect(result.current.sessions.length).toEqual(2);

    act(() =>
      result.current.addSessions([
        SESSION_MOCK,
        { ...SESSION_MOCK, topic: "66627281982" },
        { ...SESSION_MOCK, topic: "893903020" },
      ]),
    );
    expect(result.current.sessions.length).toEqual(3);

    act(() => result.current.removeSession(SESSION_MOCK.topic));
    expect(result.current.sessions.length).toEqual(2);
  });

  it("should add sessions and clear all", () => {
    const { result } = renderHook(() => useSessionsStore());

    act(() =>
      result.current.addSessions([
        SESSION_MOCK,
        { ...SESSION_MOCK, topic: "66627281982" },
        { ...SESSION_MOCK, topic: "893903020" },
      ]),
    );
    expect(result.current.sessions.length).toEqual(3);

    act(() => result.current.clearSessions());
    expect(result.current.sessions.length).toEqual(0);
  });
});
