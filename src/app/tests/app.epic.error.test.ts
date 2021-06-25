import { appSlice } from '../app.slice';
import { Epic } from 'redux-observable';
import { Observable, of } from 'rxjs';
import { eachValueFrom } from 'rxjs-for-await';
import {
  fetchProduct$,
  fetchProductManaged$,
  fetchProductWithSimpleErrorHandler$,
} from '../app.epic';
import { TestScheduler } from 'rxjs/testing';
import { Product } from '../app.model';
import { fakeAsync } from '../../logic/fakeAsync';

const {
  actions: { setProduct, fetchProduct },
} = appSlice;

const observableToArray = async (source$: Observable<any>) => {
  const result = [];
  for await (const value of eachValueFrom(source$)) {
    result.push(value);
  }
  return result;
};

// const observableToArray2 = (source$: Observable<any>) => {
//   const result: any[] = [];

//   return new Promise((resolve, reject) => {
//     source$.subscribe({
//       next: (value) => result.push(value),
//       error: (err) => {
//         reject(err);
//       },
//       complete: () => resolve(result),
//     });
//   });
// };

const product1: Product = { id: '1' };
const product2: Product = { id: '2' };
const product3: Product = { id: '3' };

const getEpicOutput = async (
  epic: Epic,
  input: any[],
  state$?: any,
  dependencies?: any
) => {
  const output$ = epic(of(...input), state$, dependencies);
  const output = await observableToArray(output$);
  return output;
};

// const getEpicOutput2 = async (
//   epic: Epic,
//   input: any[],
//   state$?: any,
//   dependencies?: any
// ) => {
//   const output$ = epic(of(...input), state$, dependencies);
//   const output = await observableToArray2(output$);
//   return output;
// };

describe('error handling', () => {
  let scheduler: TestScheduler;

  beforeEach(() => {
    scheduler = new TestScheduler((actual, expected) =>
      expect(actual).toEqual(expected)
    );
  });

  const inputValues = {
    a: fetchProduct({ id: '1' }),
    b: fetchProduct({ id: '2' }),
    c: fetchProduct({ id: '3' }),
  };

  const apiValues = {
    a: product1,
    b: product2,
    c: product3,
  };

  const expectedValues = {
    a: setProduct({ product: product1 }),
    b: setProduct({ product: product2 }),
    c: setProduct({ product: product3 }),
  };

  test('fetch product with no errors 1', () => {
    scheduler.run(({ hot, cold, expectObservable }) => {
      const input = '   a |';
      const api = '     a |';
      const expected = 'a |';

      const input$ = hot(input, inputValues);
      const dependencies = {
        api: { fetchProduct: () => cold(api, apiValues) },
      };
      const output$ = fetchProduct$(input$, null as any, dependencies as any);

      expectObservable(output$).toBe(expected, expectedValues);
    });
  });

  test('fetch product with no errors 2', () => {
    scheduler.run(({ hot, cold, expectObservable }) => {
      const input = '   a-b- |';
      const api = '     ab |';
      const expected = 'abab |';

      const input$ = hot(input, inputValues);
      const dependencies = {
        api: { fetchProduct: () => cold(api, apiValues) },
      };
      const output$ = fetchProduct$(input$, null as any, dependencies as any);

      expectObservable(output$).toBe(expected, expectedValues);
    });
  });

  test('fetch product with no errors 3', () => {
    scheduler.run(({ hot, cold, expectObservable }) => {
      const input = '   a---b- |';
      const api = '     ab |';
      const expected = 'ab--ab |';

      const input$ = hot(input, inputValues);
      const dependencies = {
        api: { fetchProduct: () => cold(api, apiValues) },
      };
      const output$ = fetchProduct$(input$, null as any, dependencies as any);

      expectObservable(output$).toBe(expected, expectedValues);
    });
  });

  test('fetch product, no error handling at all', () => {
    scheduler.run(({ hot, cold, expectObservable }) => {
      const input = '   ab |';
      const api = '     a  #';
      const expected = 'a  #';

      const input$ = hot(input, inputValues);
      const dependencies = {
        api: { fetchProduct: () => cold(api, apiValues) },
      };
      const output$ = fetchProduct$(input$, null as any, dependencies as any);

      expectObservable(output$).toBe(expected, expectedValues);
    });
  });

  test(`${fetchProductWithSimpleErrorHandler$.name} 1`, () => {
    scheduler.run(({ hot, cold, expectObservable }) => {
      const input = '   abc |';
      const api = '     a#c |';
      const expected = 'aaa |';

      const input$ = hot(input, inputValues);
      const dependencies = {
        api: { fetchProduct: () => cold(api, apiValues) },
      };
      const output$ = fetchProductWithSimpleErrorHandler$(
        input$,
        null as any,
        dependencies as any
      );

      expectObservable(output$).toBe(expected, expectedValues);
    });
  });

  test(`${fetchProductWithSimpleErrorHandler$.name} 2`, () => {
    scheduler.run(({ hot, cold, expectObservable }) => {
      const input = '   abc |';
      const expected = 'abc |';

      const input$ = hot(input, inputValues);
      const dependencies = {
        api: {
          fetchProduct: (id: string) => {
            switch (id) {
              case '1':
                return of(product1);
              case '2':
                return of(product2);
              case '3':
                return of(product3);
            }
          },
        },
      };
      const output$ = fetchProductWithSimpleErrorHandler$(
        input$,
        null as any,
        dependencies as any
      );

      expectObservable(output$).toBe(expected, expectedValues);
    });
  });

  test(`${fetchProductWithSimpleErrorHandler$.name} 2.1`, () => {
    scheduler.run(({ hot, cold, expectObservable }) => {
      const input = '   abc |';
      const expected = 'a-c |';

      const input$ = hot(input, inputValues);
      const dependencies = {
        api: {
          fetchProduct: (id: string) => {
            switch (id) {
              case '1':
                return cold('a|', { a: product1 });
              case '2':
                return cold('#');
              case '3':
                return cold('c|', { c: product3 });
            }
          },
        },
      };
      const output$ = fetchProductWithSimpleErrorHandler$(
        input$,
        null as any,
        dependencies as any
      );

      expectObservable(output$).toBe(expected, expectedValues);
    });
  });

  test(`${fetchProductWithSimpleErrorHandler$.name} 3`, () => {
    scheduler.run(({ hot, cold, expectObservable }) => {
      const input = '   a |';
      const expected = '';

      const input$ = hot(input, inputValues);
      const dependencies = {
        api: { fetchProduct: () => fakeAsync(product1) },
      };
      const output$ = fetchProductWithSimpleErrorHandler$(
        input$,
        null as any,
        dependencies as any
      );

      expectObservable(output$).toBe(expected, expectedValues);
    });
  });

  test(`${fetchProductWithSimpleErrorHandler$.name} 4`, async () => {
    const input = [
      fetchProduct({ id: '1' }),
      fetchProduct({ id: '2' }),
      fetchProduct({ id: '3' }),
    ];

    const dependencies = {
      api: {
        fetchProduct: (id: string) => {
          switch (id) {
            case '1':
              return fakeAsync(product1);
            case '2':
              return fakeAsync('Some API error', true);
            case '3':
              return fakeAsync(product3);
          }
        },
      },
    };

    const expected = [
      setProduct({ product: product1 }),
      setProduct({ product: product3 }),
    ];

    const output = await getEpicOutput(
      fetchProductWithSimpleErrorHandler$,
      input,
      null,
      dependencies
    );

    expect(JSON.stringify(output, null, 2)).toBe(
      JSON.stringify(expected, null, 2)
    );
  });

  test(`${fetchProductManaged$.name} 4`, async () => {
    const input = [
      fetchProduct({ id: '1' }),
      fetchProduct({ id: '2' }),
      fetchProduct({ id: '3' }),
    ];

    const dependencies = {
      api: {
        fetchProduct: (id: string) => {
          switch (id) {
            case '1':
              return fakeAsync(product1);
            case '2':
              return fakeAsync('Some API error', true);
            case '3':
              return fakeAsync(product3);
          }
        },
      },
    };

    const expected = [
      setProduct({ product: product1 }),
      setProduct({ product: product3 }),
    ];

    const output = await getEpicOutput(
      fetchProductManaged$,
      input,
      null,
      dependencies
    );

    expect(JSON.stringify(output, null, 2)).toBe(
      JSON.stringify(expected, null, 2)
    );
  });
});
