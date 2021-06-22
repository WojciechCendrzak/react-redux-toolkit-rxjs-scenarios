import { TestScheduler } from 'rxjs/testing';
import { delay, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

describe(switchMap.name, () => {
  let scheduler: TestScheduler;

  beforeEach(() => {
    scheduler = new TestScheduler((actual, expected) =>
      expect(actual).toEqual(expected)
    );
  });

  test(switchMap.name, () => {
    scheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('ab- |');
      const expected = '    --b |';
      const result$ = source$.pipe(switchMap((v) => of(v).pipe(delay(1))));
      expectObservable(result$).toBe(expected);
    });
  });
});
