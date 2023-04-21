import * as ts from 'typescript';

function visit(node: ts.Node) {
  if (ts.isImportDeclaration(node)) {
    console.log(
      'isImportDeclaration:',
      '\n',
      node.getText(),
      '\n',
      node.moduleSpecifier?.getText(sourceFile),
      '\n',
    );
  }
  if (ts.isImportEqualsDeclaration(node)) {
    console.log('isImportEqualsDeclaration:', '\n', node.getText(), '\n');
  }
  if (ts.isImportClause(node)) {
    console.log('isImportClause:', '\n', node.getText(), '\n');
  }
  if (ts.isCallExpression(node)) {
    console.log(
      'isCallExpression:',
      '\n',
      node.getText(),
      '\n',
      node.getText().replaceAll('\n', ' '),
      '\n',
      node.arguments[0]?.getText(sourceFile),
      '\n',
    );
  }
  if (ts.isCallLikeExpression(node)) {
    console.log('isCallLikeExpression:', '\n', node.getText(), '\n');
  }
  if (ts.isModuleDeclaration(node)) {
    console.log('isModuleDeclaration:', '\n', node.getText(), '\n');
  }
  if (ts.isExportDeclaration(node)) {
    console.log(
      'isExportDeclaration:',
      '\n',
      node.getText(),
      '\n',
      node.moduleSpecifier?.getText(sourceFile),
      '\n',
    );
  }
  if (ts.isExportAssignment(node)) {
    console.log('isExportAssignment:', '\n', node.getText(), '\n');
  }
  if (ts.isExportSpecifier(node)) {
    console.log('isExportSpecifier:', '\n', node.getText(), '\n');
  }
  if (ts.isImportOrExportSpecifier(node)) {
    console.log('isImportOrExportSpecifier:', '\n', node.getText(), '\n');
  }
  if (ts.isImportSpecifier(node)) {
    console.log('isImportSpecifier:', '\n', node.getText(), '\n');
  }
  if (ts.isImportTypeNode(node)) {
    console.log('isImportTypeNode:', '\n', node.getText(), '\n');
  }
  if (ts.isImportTypeAssertionContainer(node)) {
    console.log('isImportTypeAssertionContainer:', '\n', node.getText(), '\n');
  }
  if (ts.isNamedImportBindings(node)) {
    console.log('isNamedImportBindings:', '\n', node.getText(), '\n');
  }
  if (ts.isNamedImports(node)) {
    console.log('isNamedImports:', '\n', node.getText(), '\n');
  }
  if (ts.isNamespaceImport(node)) {
    console.log('isNamespaceImport:', '\n', node.getText(), '\n');
  }

  ts.forEachChild(node, visit);
}

const sourceCode = `
import fs from 'fs';
import bs
from 'bs';
import * as path from 'path';
const express = require('express');
const hoge = import('./hoge');
export * as fuga from './fuga';

function a() {
  const b = require(
    './b'
  );
  const c = import('./c');
}
a();
`;

const sourceFile = ts.createSourceFile(
  'sample.ts',
  sourceCode,
  ts.ScriptTarget.ES2020,
  true,
);
visit(sourceFile);
