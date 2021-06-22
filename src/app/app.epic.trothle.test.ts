import { appSlice } from './app.slice';
import { Epic, StateObservable } from 'redux-observable';
import { asyncScheduler, Observable, of } from 'rxjs';
import { eachValueFrom } from 'rxjs-for-await';
import { login$, searchProduct$, loginThrottle$ } from './app.epic';
import { User } from './app.model';
import { fakeAsync } from '../logic/fakeAsync';
import { TestScheduler } from 'rxjs/testing';
import { throttleTime } from 'rxjs/operators';

const {
  actions: { setUser, login, searchProduct, setProducts },
} = appSlice;

const observableToArray = async (source$: Observable<any>) => {
  const result = [];
  for await (const value of eachValueFrom(source$)) {
    result.push(value);
  }
  return result;
};

const state$ = {} as StateObservable<null>;

const user1: User = { id: '1', firstName: 'name 1', lastName: 'surname 1' };
const credentials = { login: 'fake login', password: 'fake password' };

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

describe('throttle', () => {
  let scheduler: TestScheduler;

  beforeEach(() => {
    scheduler = new TestScheduler((actual, expected) =>
      expect(actual).toEqual(expected)
    );
  });

  test('marble itself', () => {
    scheduler.run(({ hot, expectObservable }) => {
      const input = '   50ms a 50ms b 50ms c |';
      const expected = '50ms a 50ms b 50ms c |';
      expectObservable(hot(input)).toBe(expected);
    });
  });

  test('throttle 1', () => {
    scheduler.run(({ hot, expectObservable }) => {
      const input = '   50ms a 50ms b 49ms  c 49ms e |';
      const expected = '50ms a        100ms c 50ms   |';
      const input$ = hot(input).pipe(throttleTime(100));

      expectObservable(input$).toBe(expected);
    });
  });

  test('throttle 2', () => {
    scheduler.run(({ hot, expectObservable }) => {
      const input = '   1ms a 1ms b 1ms c 1ms d 1ms e 1ms f |';
      const expected = '1ms a       3ms c       3ms e 2ms   |';
      const input$ = hot(input).pipe(throttleTime(3));
      expectObservable(input$).toBe(expected);
    });
  });

  test('throttle 3', () => {
    scheduler.run(({ hot, expectObservable }) => {
      const input$ = hot('abcdefgahi |').pipe(throttleTime(3));
      const expected = '  a---e---h- |';
      expectObservable(input$).toBe(expected);
    });
  });

  test('throttle 4', () => {
    scheduler.run(({ hot, expectObservable }) => {
      const input$ = hot('ab-de---hi |').pipe(throttleTime(3));
      const expected = '  a---e---h- |';
      expectObservable(input$).toBe(expected);
    });
  });

  const throttleTimeTrailing = () =>
    throttleTime(3, asyncScheduler, {
      leading: true,
      trailing: true,
    });

  test('throttle 5', () => {
    scheduler.run(({ hot, expectObservable }) => {
      const input = '   ab------ |';
      const expected = 'a--b---- |';
      const input$ = hot(input).pipe(throttleTimeTrailing());
      expectObservable(input$).toBe(expected);
    });
  });

  test('throttle 6', () => {
    scheduler.run(({ hot, expectObservable }) => {
      const input = '   ab--e--- |';
      const expected = 'a--b--e- |';
      const input$ = hot(input).pipe(throttleTimeTrailing());
      expectObservable(input$).toBe(expected);
    });
  });

  test('throttle 7', () => {
    scheduler.run(({ hot, expectObservable }) => {
      const input = '   ab---e--- |';
      const expected = 'a--b--e-- |';
      const input$ = hot(input).pipe(throttleTimeTrailing());
      expectObservable(input$).toBe(expected);
    });
  });

  test('throttle 8', () => {
    scheduler.run(({ hot, expectObservable }) => {
      const input = '   ab-e----- |';
      const expected = 'a--e----- |';
      const input$ = hot(input).pipe(throttleTimeTrailing());
      expectObservable(input$).toBe(expected);
    });
  });

  test('throttle 9', () => {
    scheduler.run(({ hot, expectObservable }) => {
      const input = '   ab-ef---- |';
      const expected = 'a--e--f-- |';
      const input$ = hot(input).pipe(throttleTimeTrailing());
      expectObservable(input$).toBe(expected);
    });
  });
});

describe('loginThrottle$', () => {
  test(loginThrottle$.name, async () => {
    const input = [login(credentials), login(credentials)];
    const dependencies = {
      api: {
        login: () => fakeAsync({}),
        fetchUser: () => fakeAsync(user1),
      },
    };
    const expected = [setUser({ user: user1 })];
    const output = await getEpicOutput(login$, input, null, dependencies);

    expect(JSON.stringify(output, null, 2)).toBe(
      JSON.stringify(expected, null, 2)
    );
  });
});

describe('searchProduct$', () => {
  test(searchProduct$.name, async () => {
    const input = [
      searchProduct({ searchPhrase: 'p' }),
      searchProduct({ searchPhrase: 'pr' }),
      searchProduct({ searchPhrase: 'pro' }),
      searchProduct({ searchPhrase: 'prod' }),
      searchProduct({ searchPhrase: 'produ' }),
      searchProduct({ searchPhrase: 'produc' }),
      searchProduct({ searchPhrase: 'product' }),
    ];
    const dependencies = {
      api: {
        searchProducts: (searchPhrase: string) =>
          fakeAsync([{ id: '1', name: `${searchPhrase}` }]),
      },
    };
    const expected = [
      setProducts({ products: [{ id: '1', name: 'p' }] }),
      setProducts({ products: [{ id: '1', name: 'product' }] }),
    ];

    const output = await getEpicOutput(
      searchProduct$,
      input,
      null,
      dependencies
    );

    expect(JSON.stringify(output, null, 2)).toBe(
      JSON.stringify(expected, null, 2)
    );
  });
});
