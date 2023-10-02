export const isHTML = (string: string) => /<\/?[a-z][\s\S]*>/i.test(string);

export function tryDecodeURI(uri: string, setError: () => void) {
  try {
    if (isHTML(uri)) {
      setError();
      return "";
    } else {
      return decodeURI(uri);
    }
  } catch (err) {
    console.error(err);
    setError();
    return "";
  }
}
