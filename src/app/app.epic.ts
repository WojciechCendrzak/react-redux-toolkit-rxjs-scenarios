import { combineEpics } from 'redux-observable';
import { forkJoin, from } from 'rxjs';
import { filter, map, switchMap, tap } from 'rxjs/operators';
import { RootEpic } from './app.epics.type';
import { appSlice } from './app.slice';

const ping$: RootEpic = (action$) =>
  action$.pipe(
    filter(appSlice.actions.ping.match),
    map(() => appSlice.actions.pong())
  );

const pong$: RootEpic = (action$) =>
  action$.pipe(
    filter(appSlice.actions.pong.match),
    map(() => appSlice.actions.endGate())
  );

const fetchSingleEntity$: RootEpic = (action$, _, { fetchApi }) =>
  action$.pipe(
    filter(appSlice.actions.fetchUser.match),
    map((action) => action.payload.id),
    switchMap((id) => from(fetchApi.fetchUser(id))),
    tap(() => console.log('fetchSingleEntity')),
    map((user) => appSlice.actions.setUser({ user }))
  );

const fetchMultiplyEntitesInSequence$: RootEpic = (action$, _, { fetchApi }) =>
  action$.pipe(
    filter(appSlice.actions.login.match),
    switchMap((action) => from(fetchApi.login(action.payload))),
    switchMap((response) => from(fetchApi.fetchUser(response.id))),
    map((user) => appSlice.actions.setUser({ user }))
  );

const fetchMultiplyEntitesInParallel$: RootEpic = (action$, _, { fetchApi }) =>
  action$.pipe(
    filter(appSlice.actions.uploadPhotos.match),
    map((action) => action.payload.files),
    switchMap((files) =>
      forkJoin(files.map((file) => from(fetchApi.uploadPhoto(file))))
    ),
    map((results) =>
      appSlice.actions.setPhotos({
        photoUrls: results.map((result) => result.url),
      })
    )
  );

export const appEpic$ = combineEpics(
  ping$,
  pong$,
  fetchSingleEntity$,
  fetchMultiplyEntitesInSequence$,
  fetchMultiplyEntitesInParallel$
);
