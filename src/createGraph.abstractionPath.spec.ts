import { expect, test } from 'vitest';
import { abstractionPath } from './createGraph';
import { Node } from './models';

test('/src/components/atoms/Button.tsx atoms = /src/components/atoms', () => {
  expect(
    abstractionPath('/src/components/atoms/Button.tsx', ['atoms']),
  ).toEqual('/src/components/atoms');
});
