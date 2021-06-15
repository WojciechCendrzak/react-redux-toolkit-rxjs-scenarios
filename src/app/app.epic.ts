import { combineEpics } from 'redux-observable';
import { forkJoin, from } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';
import { RootEpic } from './app.epics.type';
import { appSlice } from './app.slice';

export const ping$: RootEpic = (action$) =>
  action$.pipe(
    filter(appSlice.actions.ping.match),
    map(() => appSlice.actions.pong())
  );

export const pong$: RootEpic = (action$) =>
  action$.pipe(
    filter(appSlice.actions.pong.match),
    map(() => appSlice.actions.endGame())
  );

// single fetch
export const fetchUser$: RootEpic = (action$, _, { fetchApi }) =>
  action$.pipe(
    filter(appSlice.actions.fetchUser.match),
    map((action) => action.payload.id),
    switchMap((id) => from(fetchApi.fetchUser(id))),
    map((user) => appSlice.actions.setUser({ user }))
  );

// multiple fetch in sequence - next input depends on previous output
export const login$: RootEpic = (action$, _, { fetchApi }) =>
  action$.pipe(
    filter(appSlice.actions.login.match),
    switchMap((action) => from(fetchApi.login(action.payload))),
    switchMap((response) => from(fetchApi.fetchUser(response.id))),
    map((user) => appSlice.actions.setUser({ user }))
  );

// multiple fetch in parallel
export const uploadPhotos$: RootEpic = (action$, _, { fetchApi }) =>
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
  fetchUser$,
  login$,
  uploadPhotos$
);
