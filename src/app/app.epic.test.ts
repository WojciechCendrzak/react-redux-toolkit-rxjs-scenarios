import { appSlice } from './app.slice';
import { Epic, StateObservable } from 'redux-observable';
import { Observable, of } from 'rxjs';
import { eachValueFrom } from 'rxjs-for-await';
import { fetchUser$, ping$, login$, uploadPhotos$ } from './app.epic';
import { User } from './app.model';
import { fakeAsync } from '../logic/fakeAsync';

const {
  actions: { ping, pong, fetchUser, setUser, login, uploadPhotos, setPhotos },
} = appSlice;

const observableToArray = async (source$: Observable<any>) => {
  const result = [];
  for await (const value of eachValueFrom(source$)) {
    result.push(value);
  }
  return result;
};

const state$ = {} as StateObservable<null>;

const user: User = {
  id: '1',
  firstName: 'first name',
  lastName: 'last name',
};

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

describe('single fetch ', () => {
  test(fetchUser$.name, async () => {
    const input = [fetchUser({ id: '1' })];
    const dependencies = {
      fetchApi: { fetchUser: (id: string) => fakeAsync(user) },
    };
    const expected = [setUser({ user })];
    const output = await getEpicOutput(fetchUser$, input, null, dependencies);

    expect(JSON.stringify(output)).toBe(JSON.stringify(expected));
  });
});

describe('multiple fetch in sequence', () => {
  test(login$.name, async () => {
    const input = [login({ login: 'fake login', password: 'fake password' })];
    const dependencies = {
      fetchApi: {
        login: () => fakeAsync({}),
        fetchUser: () => fakeAsync(user),
      },
    };
    const expected = [setUser({ user })];
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
