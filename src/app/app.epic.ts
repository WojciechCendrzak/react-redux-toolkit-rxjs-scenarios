import { combineEpics } from 'redux-observable';
import {
  asyncScheduler,
  EMPTY,
  forkJoin,
  from,
  fromEventPattern,
  of,
} from 'rxjs';
import {
  catchError,
  filter,
  map,
  mergeMap,
  switchMap,
  throttleTime,
} from 'rxjs/operators';
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
export const fetchUser$: RootEpic = (action$, _, { api }) =>
  action$.pipe(
    filter(appSlice.actions.fetchUser.match),
    map((action) => action.payload.id),
    switchMap((id) => from(api.fetchUser(id))),
    map((user) => appSlice.actions.setUser({ user }))
  );

// single fetch but not cancel previous epic
export const fetchProduct$: RootEpic = (action$, _, { api }) =>
  action$.pipe(
    filter(appSlice.actions.fetchProduct.match),
    map((action) => action.payload.id),
    mergeMap((id) => from(api.fetchProduct(id))),
    map((product) => appSlice.actions.setProduct({ product }))
  );

// multiple fetch in sequence - next input depends on previous output
export const login$: RootEpic = (action$, _, { api }) =>
  action$.pipe(
    filter(appSlice.actions.login.match),
    switchMap((action) => from(api.login(action.payload))),
    switchMap((response) => from(api.fetchUser(response.id))),
    map((user) => appSlice.actions.setUser({ user }))
  );

// multiple fetch in parallel
export const uploadPhotos$: RootEpic = (action$, _, { api }) =>
  action$.pipe(
    filter(appSlice.actions.uploadPhotos.match),
    map((action) => action.payload.files),
    switchMap((files) =>
      forkJoin(files.map((file) => from(api.uploadPhoto(file))))
    ),
    map((results) =>
      appSlice.actions.setPhotos({
        photoUrls: results.map((result) => result.url),
      })
    )
  );

// return more than one result
export const logout$: RootEpic = (action$, _, { api }) =>
  action$.pipe(
    filter(appSlice.actions.logout.match),
    switchMap(() => from(api.logout())),
    // TODO: maybe just concat map
    switchMap(() =>
      of(appSlice.actions.reset(), appSlice.actions.navigateHome())
    )
  );

export const startListeningFromWebSocket$: RootEpic = (action$, _, { api }) =>
  action$.pipe(
    filter(appSlice.actions.startListeningFromWebSocket.match),
    map(() => api.startWebSocketClient()),
    // mamybe just flatMap ???
    mergeMap((webSocketClient) =>
      fromEventPattern<MessageEvent<string>>(
        (handler) => webSocketClient.addEventListener('message', handler),
        (handler) => webSocketClient.removeEventListener('message', handler)
      )
    ),
    map((event) => event.data),
    map((message) => appSlice.actions.setMessage({ message }))
  );

// avoid multiply clicking
export const loginThrottle$: RootEpic = (action$, _, { api }) =>
  action$.pipe(
    filter(appSlice.actions.login.match),
    throttleTime(150),
    switchMap((action) => from(api.login(action.payload))),
    switchMap((response) => from(api.fetchUser(response.id))),
    map((user) => appSlice.actions.setUser({ user }))
  );

export const searchProduct$: RootEpic = (action$, _, { api }) =>
  action$.pipe(
    filter(appSlice.actions.searchProduct.match),
    throttleTime(250, asyncScheduler, {
      leading: true,
      trailing: true,
    }),
    mergeMap((action) => from(api.searchProducts(action.payload.searchPhrase))),
    map((response) => appSlice.actions.setProducts({ products: response }))
  );

export const fetchProductWithSimpleErrorHandler$: RootEpic = (
  action$,
  _,
  { api }
) =>
  action$.pipe(
    filter(appSlice.actions.fetchProduct.match),
    mergeMap((action) =>
      from(api.fetchProduct(action.payload.id)).pipe(
        catchError((error: Error) => {
          // console.log(`Error message: ${error.message}`);
          return EMPTY;
        })
      )
    ),
    map((product) => appSlice.actions.setProduct({ product }))
  );

export const appEpic$ = combineEpics(
  ping$,
  pong$,
  fetchUser$,
  login$,
  uploadPhotos$,
  startListeningFromWebSocket$,
  fetchProductWithSimpleErrorHandler$
);
