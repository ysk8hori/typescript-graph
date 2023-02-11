import { expect, test } from 'vitest';
import { getAbstractionDirArr } from './abstraction';
import { Node } from '../models';

test('atoms matches /src/components/atoms/Button.tsx', () => {
  const node: Node = {
    name: 'Button.tsx',
    path: '/src/components/atoms/Button.tsx',
  };
  const abs: string[][] = [['foo'], ['atoms'], ['bar']];
  expect(getAbstractionDirArr(abs, node)).toEqual(['atoms']);
});

test('[components,atoms] matches /src/components/atoms/Button.tsx', () => {
  const node: Node = {
    name: 'Button.tsx',
    path: '/src/components/atoms/Button.tsx',
  };
  const abs: string[][] = [
    ['components', 'foo'],
    ['components', 'atoms'],
    ['components', 'bar'],
  ];
  expect(getAbstractionDirArr(abs, node)).toEqual(['components', 'atoms']);
});

test('/src/components/atoms/Button.tsx is filterd by src,components,atoms', () => {
  const node: Node = {
    name: 'Button.tsx',
    path: '/src/components/atoms/Button.tsx',
  };
  const abs: string[][] = [
    ['src', 'components', 'foo'],
    ['src', 'components', 'atoms'],
    ['src', 'components', 'bar'],
  ];
  expect(getAbstractionDirArr(abs, node)).toEqual([
    'src',
    'components',
    'atoms',
  ]);
});

test('/src/components/atoms/Button.tsx is not filterd by atom', () => {
  const node: Node = {
    name: 'Button.tsx',
    path: '/src/components/atoms/Button.tsx',
  };
  const abs: string[][] = [['atom']];
  expect(getAbstractionDirArr(abs, node)).toBeUndefined();
});
test('/src/components/atoms/Button.tsx is not filterd by src,atoms', () => {
  const node: Node = {
    name: 'Button.tsx',
    path: '/src/components/atoms/Button.tsx',
  };
  const abs: string[][] = [['src', 'atoms']];
  expect(getAbstractionDirArr(abs, node)).toBeUndefined();
});
test('/src/components/atoms/Button.tsx is not filterd by [["atom"],["src", "atoms"]]', () => {
  const node: Node = {
    name: 'Button.tsx',
    path: '/src/components/atoms/Button.tsx',
  };
  const abs: string[][] = [['atom'], ['src', 'atoms']];
  expect(getAbstractionDirArr(abs, node)).toBeUndefined();
});
