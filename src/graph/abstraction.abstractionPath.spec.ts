import { expect, test } from 'vitest';
import { abstractionPath } from './abstraction';

test('/src/components/atoms/Button.tsx atoms = /src/components/atoms', () => {
  expect(
    abstractionPath('/src/components/atoms/Button.tsx', ['atoms']),
  ).toEqual('/src/components/atoms');
});
