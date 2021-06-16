import { appSlice } from './app.slice';
import { Epic, StateObservable } from 'redux-observable';
import { Observable, of } from 'rxjs';
import { eachValueFrom } from 'rxjs-for-await';
import {
  fetchUser$,
  ping$,
  login$,
  uploadPhotos$,
  logout$,
  fetchProduct$,
} from './app.epic';
import { Product, User } from './app.model';
import { fakeAsync } from '../logic/fakeAsync';

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
      fetchApi: { fetchUser: (id: string) => fakeAsync(user1) },
    };
    const expected = [setUser({ user: user1 })];
    const output = await getEpicOutput(fetchUser$, input, null, dependencies);

    expect(JSON.stringify(output)).toBe(JSON.stringify(expected));
  });

  test(`${fetchUser$.name} twice`, async () => {
    const input = [fetchUser({ id: '1' }), fetchUser({ id: '2' })];
    const dependencies = {
      fetchApi: {
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
      fetchApi: {
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
    const input = [login({ login: 'fake login', password: 'fake password' })];
    const dependencies = {
      fetchApi: {
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
      fetchApi: {
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
    const dependencies = { fetchApi: { logout: fakeAsync } };
    const expected = [reset(), navigateHome()];
    const output = await getEpicOutput(logout$, input, null, dependencies);

    expect(JSON.stringify(output, null, 2)).toBe(
      JSON.stringify(expected, null, 2)
    );
  });
});
