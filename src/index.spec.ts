import { expect, test } from 'vitest';
import { main } from '.';

test('hello test', () => {
  expect(main('')).toEqual('hello');
});
