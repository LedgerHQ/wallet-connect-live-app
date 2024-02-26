export const isHTML = (string: string) => /<\/?[a-z][\s\S]*>/i.test(string);

export function tryDecodeURI(uri: string) {
  try {
    if (!uri || uri.length === 0 || isHTML(uri) || !uri.includes("http")) {
      return null;
    } else {
      return decodeURI(uri);
    }
  } catch (err) {
    console.error(err);
    return null;
  }
}
