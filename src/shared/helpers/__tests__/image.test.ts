import { isHTML, tryDecodeURI } from "../image";

describe("Image Util", () => {
  it("isHTML", () => {
    expect(isHTML("polygon")).toBeFalsy();
    expect(isHTML("")).toBeFalsy();
    expect(isHTML("<svg></svg>")).toBeTruthy();
  });

  it("tryDecodeURI", () => {
    const called = tryDecodeURI("<svg></svg>");
    expect(called).toEqual(null);

    const notCalled = tryDecodeURI("https://pancakeswap.finance/favicon.ico");
    expect(notCalled).toEqual("https://pancakeswap.finance/favicon.ico");

    const notCalled5 = tryDecodeURI("https://pancakeswap.finance/logo.png");
    expect(notCalled5).toEqual("https://pancakeswap.finance/logo.png");

    // Error will be called onLoad on Image component in React because of mounting error because uri doesn't not reach any image

    const notCalled3 = tryDecodeURI("https://walletconnect.com");
    expect(notCalled3).toEqual("https://walletconnect.com");

    const notCalled4 = tryDecodeURI("polygon");
    expect(notCalled4).toEqual(null);

    const notCalled2 = tryDecodeURI("");
    expect(notCalled2).toEqual(null);

    const undif = tryDecodeURI(undefined);
    expect(undif).toEqual(null);

    const nullImg = tryDecodeURI(null);
    expect(nullImg).toEqual(null);
  });
});
