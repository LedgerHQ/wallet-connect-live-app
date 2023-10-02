import { isHTML, tryDecodeURI } from "../image";

describe("Image Util", () => {
  it("isHTML", () => {
    expect(isHTML("polygon")).toBeFalsy();
    expect(isHTML("")).toBeFalsy();
    expect(isHTML("<svg></svg>")).toBeTruthy();
  });

  it("tryDecodeURI", () => {
    const mockedSetError = jest.fn();
    const called = tryDecodeURI("<svg></svg>", mockedSetError);
    expect(called).toEqual("");
    expect(mockedSetError).toHaveBeenCalled();

    const mockedSetError5 = jest.fn();
    const notCalled = tryDecodeURI("https://pancakeswap.finance/favicon.ico", mockedSetError5);
    expect(notCalled).toEqual("https://pancakeswap.finance/favicon.ico");
    expect(mockedSetError5).not.toHaveBeenCalled();

    const mockedSetError6 = jest.fn();
    const notCalled5 = tryDecodeURI("https://pancakeswap.finance/logo.png", mockedSetError6);
    expect(notCalled5).toEqual("https://pancakeswap.finance/logo.png");
    expect(mockedSetError6).not.toHaveBeenCalled();

    // Error will be called onLoad on Image component in React because of mounting error because uri doesn't not reach any image
    const mockedSetError2 = jest.fn();
    const notCalled4 = tryDecodeURI("polygon", mockedSetError2);
    expect(notCalled4).toEqual("polygon");
    expect(mockedSetError2).not.toHaveBeenCalled();

    // Error will be called onLoad on Image component in React because of mounting error because uri doesn't not reach any image
    const mockedSetError3 = jest.fn();
    const notCalled2 = tryDecodeURI("", mockedSetError3);
    expect(notCalled2).toEqual("");
    expect(mockedSetError3).not.toHaveBeenCalled();

    // Error will be called onLoad on Image component in React because of mounting error because uri doesn't not reach any image
    const mockedSetError4 = jest.fn();
    const notCalled3 = tryDecodeURI("https://walletconnect.com", mockedSetError4);
    expect(notCalled3).toEqual("https://walletconnect.com");
    expect(mockedSetError4).not.toHaveBeenCalled();
  });
});
