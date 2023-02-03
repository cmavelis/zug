export const logProxy = (proxyObject: any) =>
  console.log(JSON.parse(JSON.stringify(proxyObject)));
