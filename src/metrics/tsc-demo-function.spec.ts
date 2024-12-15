// tsc の挙動を調査するためのテストコード
import { test, expect, describe } from 'vitest';
import ts from 'typescript';

test.each(['function a() {\n}', 'function a(num: number): boolean {\n}'])(
  '"%s" isFunctionDeclaration',
  sourceCode => {
    const sourceFile = ts.createSourceFile(
      'sample.ts',
      sourceCode,
      ts.ScriptTarget.ES2020,
      false,
    );

    const node = sourceFile.statements[0];
    console.log(node.kind);
    expect(ts.isFunctionDeclaration(node)).toBe(true);
    if (ts.isFunctionDeclaration(node)) {
      expect(node.name?.escapedText).toBe('a');
    }
  },
);

test.each(['function () {\n}', 'function* () {\n}'])(
  '"%s" isFunctionDeclaration but empty name',
  sourceCode => {
    const sourceFile = ts.createSourceFile(
      'sample.ts',
      sourceCode,
      ts.ScriptTarget.ES2020,
      false,
    );

    const node = sourceFile.statements[0];
    console.log(node.kind);
    expect(ts.isFunctionDeclaration(node)).toBe(true);
    if (ts.isFunctionDeclaration(node)) {
      expect(node.name?.escapedText).toBe('');
    }
  },
);
test.each([
  'const a = function() {\n}',
  'let a = function() {\n}',
  'var a = function() {\n}',
  'const a = function b() {\n}',
  'const a = function*() {\n}',
])('"%s" isVariableStatement and FunctionExpression', sourceCode => {
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
      ts.isFunctionExpression(
        node.declarationList.declarations[0].initializer as any,
      ),
    ).toBe(true);
  }
});
test.each([
  'const a = () => {\n}',
  'const a = b => b => b',
  'const a = (b: number): number => b',
])('"%s" isVariableStatement and ArrowFunction', sourceCode => {
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
    ).toBe(true);
  }
});

test.each(['let a;a = () => {\n}'])(
  '"%s" isVariableStatement and ArrowFunction',
  sourceCode => {
    const sourceFile = ts.createSourceFile(
      'sample.ts',
      sourceCode,
      ts.ScriptTarget.ES2020,
      false,
    );

    const node = sourceFile.statements[0];
    expect(ts.isVariableStatement(node)).toBe(true);

    const node1 = sourceFile.statements[1];
    expect(ts.isExpressionStatement(node1)).toBe(true);

    // 代入された値が関数であることを検証する
    if (
      ts.isExpressionStatement(node1) &&
      ts.isBinaryExpression(node1.expression)
    ) {
      expect(ts.isBinaryExpression(node1.expression)).toBe(true);
      expect(ts.isArrowFunction(node1.expression.right)).toBe(true);
    }
  },
);
