export const fakeAsync = <R>(result: R) =>
  new Promise<R>((resolve, reject) => {
    resolve(result);
  });
