export const logProxy = (proxyObject: any) => {
  if (proxyObject) {
    console.log(JSON.parse(JSON.stringify(proxyObject)));
  } else {
    console.log(proxyObject);
  }
};

export const getServerURL = () => {
  const { protocol, hostname } = window.location;
  let { port } = window.location;
  if (port === '5173') port = '8000';
  return `${protocol}//${hostname}:${port}`;
};
