// tsc の挙動を調査するためのテストコード
import { test, expect, describe } from 'vitest';
import ts from 'typescript';

test.each(['const a = 1'])(
  '"%s" isVariableStatement and not ArrowFunction',
  sourceCode => {
    const sourceFile = ts.createSourceFile(
      'sample.ts',
      sourceCode,
      ts.ScriptTarget.ES2020,
      false,
    );

    const node = sourceFile.statements[0];
    console.log(node.kind);
    expect(ts.isVariableStatement(node)).toBe(true);
    // variableStatement に代入された値が関数であることを検証する
    if (ts.isVariableStatement(node)) {
      expect(
        ts.isArrowFunction(
          node.declarationList.declarations[0].initializer as any,
        ),
      ).toBe(false);
    }
  },
);
