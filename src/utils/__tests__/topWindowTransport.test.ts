import { describe, expect, it, vi } from "vitest";
import { TopWindowTransport } from "../topWindowTransport";

const TOP_ORIGIN = "https://app.enterprise.ledger.com";

function setup() {
  const target = new EventTarget();
  const top = { postMessage: vi.fn() };
  const win = Object.assign(target, { top }) as unknown as Window;
  const transport = new TopWindowTransport(win, TOP_ORIGIN);
  const onMessage = vi.fn();
  transport.onMessage = onMessage;
  transport.connect();

  const dispatch = (init: MessageEventInit) =>
    win.dispatchEvent(new MessageEvent("message", init));

  return { win, top, transport, onMessage, dispatch };
}

describe("TopWindowTransport", () => {
  it("should forward string messages from the top window on its origin", () => {
    const { top, onMessage, dispatch } = setup();

    dispatch({
      data: "hello",
      origin: TOP_ORIGIN,
      source: top as unknown as Window,
    });

    expect(onMessage).toHaveBeenCalledWith("hello");
  });

  it("should drop messages from another origin", () => {
    const { top, onMessage, dispatch } = setup();

    dispatch({
      data: "hello",
      origin: "https://evil.com",
      source: top as unknown as Window,
    });

    expect(onMessage).not.toHaveBeenCalled();
  });

  it("should drop messages from a source other than the top window", () => {
    const { onMessage, dispatch } = setup();

    dispatch({
      data: "hello",
      origin: TOP_ORIGIN,
      source: { postMessage: vi.fn() } as unknown as Window,
    });
    dispatch({ data: "hello", origin: TOP_ORIGIN });

    expect(onMessage).not.toHaveBeenCalled();
  });

  it("should drop non string messages", () => {
    const { top, onMessage, dispatch } = setup();

    dispatch({
      data: { foo: "bar" },
      origin: TOP_ORIGIN,
      source: top as unknown as Window,
    });

    expect(onMessage).not.toHaveBeenCalled();
  });

  it("should stop listening once disconnected", () => {
    const { top, transport, onMessage, dispatch } = setup();

    transport.disconnect();
    dispatch({
      data: "hello",
      origin: TOP_ORIGIN,
      source: top as unknown as Window,
    });

    expect(onMessage).not.toHaveBeenCalled();
  });

  it("should post to the top window on the pinned origin", () => {
    const { top, transport } = setup();

    transport.send("hello");

    expect(top.postMessage).toHaveBeenCalledWith("hello", TOP_ORIGIN);
  });
});
