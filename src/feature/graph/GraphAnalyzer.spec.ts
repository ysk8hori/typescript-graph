import { test, expect } from 'vitest';
import { GraphAnalyzer } from './GraphAnalyzer';
import ts from 'typescript';
import AstLogger from '../util/AstLogger';
import AstTraverser from '../util/AstTraverser';
import path from 'path';

test('GraphAnalyzer は Visitor として機能しソースファイルひとつ分のグラフを生成する', () => {
  const rootDir = path.resolve(__dirname, '../../../');
  console.log('rootDir', rootDir);
  const system = {
    ...ts.sys,
    fileExists: () => true,
    directoryExists: () => true,
  } satisfies ts.System;
  const tsconfig = ts.parseJsonConfigFileContent({}, system, rootDir);
  tsconfig.options.rootDir = rootDir;
  const source = ts.createSourceFile(
    `${rootDir}/src/feature/graph/sample.tsx`,
    'import a from "./a"; import { b } from \'../../b\'; import type { C } from "./c";',
    ts.ScriptTarget.ESNext,
    // parent を使うことがあるので true
    true,
    ts.ScriptKind.TS,
  );
  const astLogger = new AstLogger();
  const analyzer = new GraphAnalyzer(source, tsconfig, system);
  const astTraverser = new AstTraverser(source, [astLogger, analyzer]);
  astTraverser.traverse();
  console.log(astLogger.log);
  expect(analyzer.generateGraph()).toMatchInlineSnapshot(`
    {
      "nodes": [
        {
          "changeStatus": "not_modified",
          "name": "sample.tsx",
          "path": "src/feature/graph/sample.tsx",
        },
        {
          "changeStatus": "not_modified",
          "name": "a.ts",
          "path": "src/feature/graph/a.ts",
        },
        {
          "changeStatus": "not_modified",
          "name": "b.ts",
          "path": "src/b.ts",
        },
        {
          "changeStatus": "not_modified",
          "name": "c.ts",
          "path": "src/feature/graph/c.ts",
        },
      ],
      "relations": [
        {
          "changeStatus": "not_modified",
          "from": {
            "changeStatus": "not_modified",
            "name": "sample.tsx",
            "path": "src/feature/graph/sample.tsx",
          },
          "kind": "depends_on",
          "to": {
            "changeStatus": "not_modified",
            "name": "a.ts",
            "path": "src/feature/graph/a.ts",
          },
        },
        {
          "changeStatus": "not_modified",
          "from": {
            "changeStatus": "not_modified",
            "name": "sample.tsx",
            "path": "src/feature/graph/sample.tsx",
          },
          "kind": "depends_on",
          "to": {
            "changeStatus": "not_modified",
            "name": "b.ts",
            "path": "src/b.ts",
          },
        },
        {
          "changeStatus": "not_modified",
          "from": {
            "changeStatus": "not_modified",
            "name": "sample.tsx",
            "path": "src/feature/graph/sample.tsx",
          },
          "kind": "depends_on",
          "to": {
            "changeStatus": "not_modified",
            "name": "c.ts",
            "path": "src/feature/graph/c.ts",
          },
        },
      ],
    }
  `);
});
