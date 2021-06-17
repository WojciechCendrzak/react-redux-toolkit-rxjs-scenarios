import { filter, map, mergeMap } from 'rxjs/operators';
import { RootEpic } from '../app/app.epics.type';
import { appSlice } from '../app/app.slice';
import { TestScheduler } from 'rxjs/testing';
import { StateObservable } from 'redux-observable';
import { Observable, of } from 'rxjs';
import { User } from '../app/app.model';
import { Action } from '@reduxjs/toolkit';

const {
  actions: { fetchUser, setUser },
} = appSlice;

export const fetchUserEpic$: RootEpic = (action$, _, { api }) =>
  action$.pipe(
    filter(fetchUser.match),
    mergeMap((action) => api.fetchUser(action.payload.id)),
    map((user) => setUser({ user }))
  );

describe.skip('new approach', () => {
  const state$ = new StateObservable(of(), null);
  const user: User = {
    id: '123',
    firstName: 'first name',
    lastName: 'last name',
  };

  type Streams = [Observable<Action>, Observable<Action>];
  const streams: any[] = [];

  const testScheduler = new TestScheduler((actual, expected) => {
    expect(JSON.stringify(actual, null, 2)).toBe(
      JSON.stringify(expected, null, 2)
    );
  });

  testScheduler.run(({ hot, cold, expectObservable }) => {
    describe.each`
      streamKey      | typ          | timeLine     | a
      ${'actions$'}  | ${'hot'}     | ${'-a'}      | ${appSlice.actions.fetchUser({ id: '123' })}
      ${'fetchUser'} | ${'cold'}    | ${'-----a'}  | ${user}
      ${'expected$'} | ${undefined} | ${'-a'}      | ${appSlice.actions.setUser({ user })}
      ${undefined}   | ${undefined} | ${undefined} | ${undefined}
    `(``, ({ streamKey, typ, timeLine, a }) => {
      if (streamKey) {
        typ === 'hot' && streams.push(hot(timeLine, { a }));
        typ === 'cold' && streams.push(cold(timeLine, { a }));
        typ === undefined && streams.push([timeLine, { a }]);
      } else {
        test('new approach test', () => {
          const [actions$, fetchUser, [timeline, values]] = streams;
          const output$ = fetchUserEpic$(actions$, state$, {
            api: { fetchUser: (id: string) => fetchUser },
          } as any);

          expectObservable(output$).toBe(timeline, values);
        });
      }
    });
  });
});
