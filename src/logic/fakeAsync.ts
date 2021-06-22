type FakeAsync = {
  (): Promise<void>;
  <R>(result: R, isError?: boolean): Promise<R>;
};

export const fakeAsync: FakeAsync = <R>(result?: R, isError?: boolean) =>
  result
    ? new Promise<R>((resolve, reject) =>
        !isError ? resolve(result) : reject(result)
      )
    : new Promise<void>((resolve, reject) =>
        !isError ? resolve() : reject(result)
      );

// Just other way to overload function

// export function fakeAsync(): Promise<void>;
// export function fakeAsync<R>(result: R): Promise<R>;
// export function fakeAsync(result?: any): any {
//   return new Promise((resolve) => {
//     result && resolve(result);
//     !result && resolve(result);
//   });
// }
