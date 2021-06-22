import { TestScheduler } from 'rxjs/testing';
import { delay, mergeMap } from 'rxjs/operators';
import { of } from 'rxjs';

describe(mergeMap.name, () => {
  let scheduler: TestScheduler;

  beforeEach(() => {
    scheduler = new TestScheduler((actual, expected) =>
      expect(actual).toEqual(expected)
    );
  });

  test(mergeMap.name, () => {
    scheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('ab- |');
      const expected = '    -ab |';
      const result$ = source$.pipe(mergeMap((v) => of(v).pipe(delay(1))));
      expectObservable(result$).toBe(expected);
    });
  });
});
