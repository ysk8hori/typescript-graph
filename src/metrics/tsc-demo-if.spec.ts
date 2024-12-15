import { test, expect, describe } from 'vitest';
import ts from 'typescript';
import { logAstNodes } from './tsc-demo-util';

test.each(['if', 'if (true) {}', 'else if'])(
  '"%s" is IfStatement',
  sourceCode => {
    const sourceFile = ts.createSourceFile(
      'sample.ts',
      sourceCode,
      ts.ScriptTarget.ES2020,
      false,
    );

    const node = sourceFile.statements[0];
    console.log(node.kind);
    expect(ts.isIfStatement(node)).toBe(true);
  },
);

test.each([
  ['const a = false ?? true;', 1],
  ['const a = false ?? false ?? true;', 2],
])('"%s" has %d QuestionQuestionToken', (sourceCode, expected) => {
  logAstNodes(sourceCode);

  const sourceFile = ts.createSourceFile(
    'sample.ts',
    sourceCode,
    ts.ScriptTarget.ESNext,
  );

  let count = 0;
  const visit = (node: ts.Node) => {
    if (node.kind === ts.SyntaxKind.QuestionQuestionToken) {
      count++;
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  expect(count).toBe(expected);
});

test.each([
  ['const a = hoge?.fuga?.piyo();', 2],
  ['const a = hoge?.fuga?.piyo(), b=hoge?.fuga?.piyo();', 4],
])('"%s" has %d QuestionDotToken', (sourceCode, expected) => {
  logAstNodes(sourceCode);
  const sourceFile = ts.createSourceFile(
    'sample.ts',
    sourceCode,
    ts.ScriptTarget.ESNext,
  );
  let count = 0;
  const visit = (node: ts.Node) => {
    if (ts.isQuestionDotToken(node)) {
      count++;
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  expect(count).toBe(expected);
});

test.each([
  ['const a = hoge ? fuga : piyo;', 1],
  ['const a = hoge ? fuga ? fuga : piyo;', 2],
])('"%s" has %d ConditionalExpression', (sourceCode, expected) => {
  logAstNodes(sourceCode);
  const sourceFile = ts.createSourceFile(
    'sample.ts',
    sourceCode,
    ts.ScriptTarget.ESNext,
  );
  let count = 0;
  const visit = (node: ts.Node) => {
    if (ts.isConditionalExpression(node)) {
      count++;
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  expect(count).toBe(expected);
});

test.each([
  ['switch (a) {case 1: hoge();break;case 2: hoge();break; default:break;}', 3],
])('"%s" has %d CaseClause or DefaultClause', (sourceCode, expected) => {
  logAstNodes(sourceCode);

  const sourceFile = ts.createSourceFile(
    'sample.ts',
    sourceCode,
    ts.ScriptTarget.ESNext,
  );

  let count = 0;
  const visit = (node: ts.Node) => {
    if (ts.isCaseClause(node) || ts.isDefaultClause(node)) {
      count++;
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  expect(count).toBe(expected);
});
