export const logProxy = (proxyObject: any) => {
  if (proxyObject) {
    console.log(JSON.parse(JSON.stringify(proxyObject)));
  } else {
    console.log(proxyObject);
  }
};
