import { combineEpics } from 'redux-observable';
import { fetchEpic$ } from '../scenarios/fetch.epic';

export const rootEpic$ = combineEpics(fetchEpic$);
