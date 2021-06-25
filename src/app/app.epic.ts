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
import { managed } from '../operators/managed.operator';
import { RootEpic } from './app.epics.type';
import { appSlice } from './app.slice';

// 1. Fetching from API
export const fetchProduct$: RootEpic = (actions$, _, { api }) =>
  actions$.pipe(
    filter(appSlice.actions.fetchProduct.match),
    map((action) => action.payload.id),
    mergeMap((id) => from(api.fetchProduct(id))),
    map((product) => appSlice.actions.setProduct({ product }))
  );

// 2. Fetching from API with cancel
export const fetchSelectedProduct$: RootEpic = (actions$, _, { api }) =>
  actions$.pipe(
    filter(appSlice.actions.fetchSelectedProduct.match),
    map((action) => action.payload.id),
    switchMap((id) => from(api.fetchProduct(id))),
    map((product) => appSlice.actions.setSelectedProduct({ product }))
  );

// 3. Calling API sequentially
export const login$: RootEpic = (actions$, _, { api }) =>
  actions$.pipe(
    filter(appSlice.actions.login.match),
    switchMap((action) => from(api.login(action.payload))),
    switchMap((response) => from(api.fetchUser(response.id))),
    map((user) => appSlice.actions.setUser({ user }))
  );

// 4. Calling API parallelly
export const uploadPhotos$: RootEpic = (actions$, _, { api }) =>
  actions$.pipe(
    filter(appSlice.actions.uploadPhotos.match),
    map((action) => action.payload.files),
    switchMap((files) =>
      forkJoin(files.map((file) => from(api.uploadPhoto(file))))
    ),
    map((responses) =>
      appSlice.actions.setPhotos({
        photoUrls: responses.map((result) => result.url),
      })
    )
  );

// 5. Emitting more than one action from epic
export const logout$: RootEpic = (actions$, _, { api }) =>
  actions$.pipe(
    filter(appSlice.actions.logout.match),
    switchMap(() => from(api.logout())),
    switchMap(() =>
      of(appSlice.actions.reset(), appSlice.actions.navigateHome())
    )
  );

// 6. WebSocket listening
export const startListeningFromWebSocket$: RootEpic = (actions$, _, { api }) =>
  actions$.pipe(
    filter(appSlice.actions.startListeningFromWebSocket.match),
    map(() => api.startWebSocketClient()),
    switchMap((webSocketClient) =>
      fromEventPattern<MessageEvent<string>>(
        (handler) => webSocketClient.addEventListener('message', handler),
        (handler) => webSocketClient.removeEventListener('message', handler)
      )
    ),
    map((event) => event.data),
    map((message) => appSlice.actions.appendMessage({ message }))
  );

// 7. Avoiding multiply button click
export const loginThrottle$: RootEpic = (actions$, _, { api }) =>
  actions$.pipe(
    filter(appSlice.actions.login.match),
    throttleTime(150),
    switchMap((action) => from(api.login(action.payload))),
    switchMap((response) => from(api.fetchUser(response.id))),
    map((user) => appSlice.actions.setUser({ user }))
  );

// 8. Live search optimizing
export const searchProduct$: RootEpic = (actions$, _, { api }) =>
  actions$.pipe(
    filter(appSlice.actions.searchProduct.match),
    throttleTime(250, asyncScheduler, {
      leading: true,
      trailing: true,
    }),
    mergeMap((action) => from(api.searchProducts(action.payload.searchPhrase))),
    map((response) => appSlice.actions.setProducts({ products: response }))
  );

// 9. Simple error handling
export const fetchProductWithSimpleErrorHandler$: RootEpic = (
  actions$,
  _,
  { api }
) =>
  actions$.pipe(
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

// 10. Bit advanced error handling
export const fetchProductManaged$: RootEpic = (actions$, _, { api }) =>
  actions$.pipe(
    filter(appSlice.actions.fetchProduct.match),
    managed(mergeMap((action) => from(api.fetchProduct(action.payload.id)))),
    map((product) => appSlice.actions.setProduct({ product }))
  );

export const ping$: RootEpic = (actions$) =>
  actions$.pipe(
    filter(appSlice.actions.ping.match),
    map(() => appSlice.actions.pong())
  );

export const pong$: RootEpic = (actions$) =>
  actions$.pipe(
    filter(appSlice.actions.pong.match),
    map(() => appSlice.actions.endGame())
  );

export const appEpic$ = combineEpics(
  ping$,
  pong$,
  fetchSelectedProduct$,
  login$,
  uploadPhotos$,
  startListeningFromWebSocket$,
  fetchProductWithSimpleErrorHandler$
);
