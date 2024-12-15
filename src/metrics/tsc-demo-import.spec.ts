// tsc の挙動を調査するためのテストコード
import { test, expect, describe } from 'vitest';
import ts from 'typescript';

test.each([`import fs from 'fs';`, `import * as path from 'path';`])(
  '%s isImportDeclaration',
  sourceCode => {
    const sourceFile = ts.createSourceFile(
      'sample.ts',
      sourceCode,
      ts.ScriptTarget.ES2020,
      false,
    );

    expect(ts.isImportDeclaration(sourceFile.statements[0])).toBe(true);
  },
);

test('isImportEqualsDeclaration', () => {
  const sourceCode = `
  import bs;
  `;
  const sourceFile = ts.createSourceFile(
    'sample.ts',
    sourceCode,
    ts.ScriptTarget.ES2020,
    false,
  );

  expect(ts.isImportEqualsDeclaration(sourceFile.statements[0])).toBe(true);
});
