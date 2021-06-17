import { appSlice } from './app.slice';
import { Epic, StateObservable } from 'redux-observable';
import { asyncScheduler, from, Observable, of } from 'rxjs';
import { eachValueFrom } from 'rxjs-for-await';
import {
  fetchUser$,
  ping$,
  login$,
  uploadPhotos$,
  logout$,
  fetchProduct$,
  startListeningFromWebSocket$,
  searchProduct$,
  loginThrottle$,
} from './app.epic';
import { Product, User } from './app.model';
import { fakeAsync } from '../logic/fakeAsync';
import WS from 'jest-websocket-mock';
import { TestScheduler } from 'rxjs/testing';
import { debounceTime, throttleTime } from 'rxjs/operators';

const {
  actions: {
    ping,
    pong,
    fetchUser,
    setUser,
    login,
    uploadPhotos,
    setPhotos,
    logout,
    reset,
    navigateHome,
    fetchProduct,
    setProduct,
    startListeningFromWebSocket,
    setMessage,
    searchProduct,
    setProducts,
  },
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
const user2: User = { id: '2', firstName: 'name 2', lastName: 'surname 2' };
const product1: Product = { id: '1', name: 'product name' };
const product2: Product = { id: '2', name: 'product name' };
const credentials = { login: 'fake login', password: 'fake password' };

const getEpicOutput = async (
  epic: Epic,
  input: any[],
  state?: any,
  dependencies?: any
) => {
  const output$ = epic(of(...input), state$, dependencies);
  const output = await observableToArray(output$);
  return output;
};

describe('ping pong', () => {
  test(ping$.name, async () => {
    const input = [ping()];
    const expected = [pong()];
    const output = await getEpicOutput(ping$, input);

    expect(JSON.stringify(output)).toBe(JSON.stringify(expected));
  });

  test(`${ping$.name} - multiple`, async () => {
    const input = [ping(), ping()];
    const expected = [pong(), pong()];
    const output = await getEpicOutput(ping$, input);

    expect(JSON.stringify(output)).toBe(JSON.stringify(expected));
  });
});

describe('single fetch and cancel previous', () => {
  test(`${fetchUser$.name} ones`, async () => {
    const input = [fetchUser({ id: '1' })];
    const dependencies = {
      api: { fetchUser: (id: string) => fakeAsync(user1) },
    };
    const expected = [setUser({ user: user1 })];
    const output = await getEpicOutput(fetchUser$, input, null, dependencies);

    expect(JSON.stringify(output)).toBe(JSON.stringify(expected));
  });

  test(`${fetchUser$.name} twice`, async () => {
    const input = [fetchUser({ id: '1' }), fetchUser({ id: '2' })];
    const dependencies = {
      api: {
        fetchUser: (id: string) =>
          id === '1' ? fakeAsync(user1) : fakeAsync(user2),
      },
    };
    const expected = [setUser({ user: user2 })];
    const output = await getEpicOutput(fetchUser$, input, null, dependencies);

    expect(JSON.stringify(output)).toBe(JSON.stringify(expected));
  });
});

describe('single fetch but not cancel previous', () => {
  test(fetchProduct$.name, async () => {
    const input = [fetchProduct({ id: '1' }), fetchProduct({ id: '2' })];
    const dependencies = {
      api: {
        fetchProduct: (id: string) =>
          fakeAsync(id === '1' ? product1 : product2),
      },
    };
    const expected = [
      setProduct({ product: product1 }),
      setProduct({ product: product2 }),
    ];
    const output = await getEpicOutput(
      fetchProduct$,
      input,
      null,
      dependencies
    );

    expect(JSON.stringify(output, null, 2)).toBe(
      JSON.stringify(expected, null, 2)
    );
  });
});

describe('multiple fetch in sequence', () => {
  test(login$.name, async () => {
    const input = [login(credentials)];
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

describe('multiple fetch in parallel', () => {
  test(uploadPhotos$.name, async () => {
    const input = [
      uploadPhotos({ files: ['1', '2', '3'] as unknown as File[] }),
    ];
    const dependencies = {
      api: {
        uploadPhoto: (val: any) => fakeAsync({ url: val }),
      },
    };
    const expected = [setPhotos({ photoUrls: ['1', '2', '3'] })];
    const output = await getEpicOutput(
      uploadPhotos$,
      input,
      null,
      dependencies
    );

    expect(JSON.stringify(output, null, 2)).toBe(
      JSON.stringify(expected, null, 2)
    );
  });
});

describe('return more than one action', () => {
  test(logout$.name, async () => {
    const input = [logout()];
    const dependencies = { api: { logout: fakeAsync } };
    const expected = [reset(), navigateHome()];
    const output = await getEpicOutput(logout$, input, null, dependencies);

    expect(JSON.stringify(output, null, 2)).toBe(
      JSON.stringify(expected, null, 2)
    );
  });
});

describe('web socket recieiving', () => {
  test(startListeningFromWebSocket$.name, async () => {
    const input = [startListeningFromWebSocket()];
    const WEB_SOCKET_URL = 'ws://localhost:1234';
    const server = new WS(WEB_SOCKET_URL);
    const dependencies = {
      api: { startWebSocketClient: () => new WebSocket(WEB_SOCKET_URL) },
    };
    const expected = [
      setMessage({ message: 'message 1' }),
      setMessage({ message: 'message 2' }),
    ];
    const output$ = startListeningFromWebSocket$(
      from(input),
      null as any,
      dependencies as any
    );
    const output: any[] = [];
    const outputObserver = output$.subscribe({
      next: (value: any) => output.push(value),
    });

    server.send('message 1');
    server.send('message 2');
    outputObserver.unsubscribe();

    expect(JSON.stringify(output, null, 2)).toBe(
      JSON.stringify(expected, null, 2)
    );
  });
});

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

describe('debouncer', () => {
  let scheduler: TestScheduler;

  beforeEach(() => {
    scheduler = new TestScheduler((actual, expected) =>
      expect(actual).toEqual(expected)
    );
  });

  test('debounce 1', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('a b 250ms |');
      const expected$ = '   - 250ms b |';
      const result$ = source$.pipe(debounceTime(250));
      expectObservable(result$).toBe(expected$);
    });
  });

  test('debounce 2', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('abcdefgh 250ms |');
      const expected$ = '   ------- 250ms h |';
      const result$ = source$.pipe(debounceTime(250));
      expectObservable(result$).toBe(expected$);
    });
  });

  test('debounce 3', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('a b --- c --- |');
      const expected$ = '   - --- b --- c |';
      const result$ = source$.pipe(debounceTime(3));
      expectObservable(result$).toBe(expected$);
    });
  });

  test('debounce 4', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('ab---c--- |');
      const expected$ = '   ----b---c |';
      const result$ = source$.pipe(debounceTime(3));
      expectObservable(result$).toBe(expected$);
    });
  });

  test('debounce 5', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('ab------- |');
      const expected$ = '   ----b---- |';
      const result$ = source$.pipe(debounceTime(3));
      expectObservable(result$).toBe(expected$);
    });
  });

  test('debounce 6', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('abcdefgh 250ms ddddddg 250ms |');
      const expected$ = '   ------- 250ms h ------ 250ms g |';
      const result$ = source$.pipe(debounceTime(250));
      expectObservable(result$).toBe(expected$);
    });
  });

  test('debounce 7', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const input = '   a 1ms b 3ms |';
      const expected = '- 1ms 3ms b |';
      const input$ = cold(input).pipe(debounceTime(3));
      expectObservable(input$).toBe(expected);
    });
  });

  test('debounce 8', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const input = '   a b 3ms |';
      const expected = '- 3ms b |';
      const input$ = cold(input).pipe(debounceTime(3));
      expectObservable(input$).toBe(expected);
    });
  });

  test('debounce 9', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const input = '   a b c d e f 3ms |';
      const expected = '- - - - - 3ms f |';
      const input$ = cold(input).pipe(debounceTime(3));
      expectObservable(input$).toBe(expected);
    });
  });

  test('debounce 10', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('a------ |');
      const expected$ = '   ---a--- |';
      const result$ = source$.pipe(debounceTime(3));
      expectObservable(result$).toBe(expected$);
    });
  });

  test('debounce 11', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('ab------ |');
      const expected$ = '   ----b--- |';
      const result$ = source$.pipe(debounceTime(3));
      expectObservable(result$).toBe(expected$);
    });
  });

  test('debounce 12', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('abc----- |');
      const expected$ = '   -----c-- |';
      const result$ = source$.pipe(debounceTime(3));
      expectObservable(result$).toBe(expected$);
    });
  });

  test('debounce 13', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('a---b--- |');
      const expected$ = '   ---a---b |';

      const result$ = source$.pipe(debounceTime(3));
      expectObservable(result$).toBe(expected$);
    });
  });

  test('debounce 14', () => {
    scheduler.run(({ hot, expectObservable }) => {
      const input$ = hot('abcdefgahij--- |').pipe(debounceTime(3));
      const expected = '  -------------j |';
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
