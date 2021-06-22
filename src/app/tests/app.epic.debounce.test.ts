import { TestScheduler } from 'rxjs/testing';
import { debounceTime } from 'rxjs/operators';

describe('debouncer', () => {
  let scheduler: TestScheduler;

  beforeEach(() => {
    scheduler = new TestScheduler((actual, expected) =>
      expect(actual).toEqual(expected)
    );
  });

  test('debounce 1', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('a b 250ms |');
      const expected$ = '   - 250ms b |';
      const result$ = source$.pipe(debounceTime(250));
      expectObservable(result$).toBe(expected$);
    });
  });

  test('debounce 2', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('abcdefgh 250ms |');
      const expected$ = '   ------- 250ms h |';
      const result$ = source$.pipe(debounceTime(250));
      expectObservable(result$).toBe(expected$);
    });
  });

  test('debounce 3', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('a b --- c --- |');
      const expected$ = '   - --- b --- c |';
      const result$ = source$.pipe(debounceTime(3));
      expectObservable(result$).toBe(expected$);
    });
  });

  test('debounce 4', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('ab---c--- |');
      const expected$ = '   ----b---c |';
      const result$ = source$.pipe(debounceTime(3));
      expectObservable(result$).toBe(expected$);
    });
  });

  test('debounce 5', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('ab------- |');
      const expected$ = '   ----b---- |';
      const result$ = source$.pipe(debounceTime(3));
      expectObservable(result$).toBe(expected$);
    });
  });

  test('debounce 6', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('abcdefgh 250ms ddddddg 250ms |');
      const expected$ = '   ------- 250ms h ------ 250ms g |';
      const result$ = source$.pipe(debounceTime(250));
      expectObservable(result$).toBe(expected$);
    });
  });

  test('debounce 7', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const input = '   a 1ms b 3ms |';
      const expected = '- 1ms 3ms b |';
      const input$ = cold(input).pipe(debounceTime(3));
      expectObservable(input$).toBe(expected);
    });
  });

  test('debounce 8', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const input = '   a b 3ms |';
      const expected = '- 3ms b |';
      const input$ = cold(input).pipe(debounceTime(3));
      expectObservable(input$).toBe(expected);
    });
  });

  test('debounce 9', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const input = '   a b c d e f 3ms |';
      const expected = '- - - - - 3ms f |';
      const input$ = cold(input).pipe(debounceTime(3));
      expectObservable(input$).toBe(expected);
    });
  });

  test('debounce 10', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('a------ |');
      const expected$ = '   ---a--- |';
      const result$ = source$.pipe(debounceTime(3));
      expectObservable(result$).toBe(expected$);
    });
  });

  test('debounce 11', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('ab------ |');
      const expected$ = '   ----b--- |';
      const result$ = source$.pipe(debounceTime(3));
      expectObservable(result$).toBe(expected$);
    });
  });

  test('debounce 12', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('abc----- |');
      const expected$ = '   -----c-- |';
      const result$ = source$.pipe(debounceTime(3));
      expectObservable(result$).toBe(expected$);
    });
  });

  test('debounce 13', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('a---b--- |');
      const expected$ = '   ---a---b |';

      const result$ = source$.pipe(debounceTime(3));
      expectObservable(result$).toBe(expected$);
    });
  });

  test('debounce 14', () => {
    scheduler.run(({ hot, expectObservable }) => {
      const input$ = hot('abcdefgahij--- |').pipe(debounceTime(3));
      const expected = '  -------------j |';
      expectObservable(input$).toBe(expected);
    });
  });
});
