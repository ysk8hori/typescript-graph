import { it, expect } from 'vitest';
import { abstraction } from './abstraction';

it('指定したディレクトリを抽象化できる', () => {
  expect(
    abstraction(['src/a/b', 'src/a/b/c'], {
      nodes: [
        {
          path: 'src/a/a.ts',
          name: 'a.ts',
          changeStatus: 'not_modified',
        },
        {
          path: 'src/a/b/b.ts',
          name: 'b.ts',
          changeStatus: 'not_modified',
        },
        {
          path: 'src/a/b/c/c.ts',
          name: 'c.ts',
          changeStatus: 'not_modified',
        },
        {
          path: 'src/a/b/c/d/d.ts',
          name: 'd.ts',
          changeStatus: 'not_modified',
        },
      ],
      relations: [],
    }),
  ).toMatchInlineSnapshot(`
    {
      "nodes": [
        {
          "changeStatus": "not_modified",
          "name": "a.ts",
          "path": "src/a/a.ts",
        },
        {
          "changeStatus": "not_modified",
          "isDirectory": true,
          "name": "/b",
          "path": "src/a/b",
        },
      ],
      "relations": [],
    }
  `);
});

it('ファイル名を指定した場合、その対象はディレクトリ扱いにならない', () => {
  expect(
    abstraction(['src/a/b', 'src/a/b/c', 'src/a/a.ts'], {
      nodes: [
        {
          path: 'src/a/a.ts',
          name: 'a.ts',
          changeStatus: 'not_modified',
        },
        {
          path: 'src/a/b/b.ts',
          name: 'b.ts',
          changeStatus: 'not_modified',
        },
        {
          path: 'src/a/b/c/c.ts',
          name: 'c.ts',
          changeStatus: 'not_modified',
        },
        {
          path: 'src/a/b/c/d/d.ts',
          name: 'd.ts',
          changeStatus: 'not_modified',
        },
      ],
      relations: [],
    }),
  ).toMatchInlineSnapshot(`
    {
      "nodes": [
        {
          "changeStatus": "not_modified",
          "name": "a.ts",
          "path": "src/a/a.ts",
        },
        {
          "changeStatus": "not_modified",
          "isDirectory": true,
          "name": "/b",
          "path": "src/a/b",
        },
      ],
      "relations": [],
    }
  `);
});
