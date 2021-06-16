type FakeAsync = {
  (): Promise<void>;
  <R>(result: R): Promise<R>;
};

export const fakeAsync: FakeAsync = <R>(result?: R) =>
  result
    ? new Promise<R>((resolve) => resolve(result))
    : new Promise<void>((resolve) => resolve());

// Just other way to overload function

// export function fakeAsync(): Promise<void>;
// export function fakeAsync<R>(result: R): Promise<R>;
// export function fakeAsync(result?: any): any {
//   return new Promise((resolve) => {
//     result && resolve(result);
//     !result && resolve(result);
//   });
// }
