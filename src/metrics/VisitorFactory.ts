import ts from 'typescript';
import { AstVisitor } from './AstTraverser';
import {
  getConstructorName,
  getGetAccessorName,
  getMethodName,
  getSetAccessorName,
  isTopLevelArrowFunction,
  isTopLevelClass,
  isTopLevelFunction,
  isTopLevelIIFE,
  isTopLevelObjectLiteralExpression,
} from './astUtils';

export class TopLevelVisitorFactory<T extends AstVisitor> {
  constructor(
    private readonly topLevelDepth: number,
    private readonly visitors: {
      createFunctionVisitor: (node: ts.FunctionDeclaration) => T;
      createArrowFunctionVisitor: (node: ts.ArrowFunction) => T;
      createIIFEVisitor: () => T;
      createClassVisitor: (node: ts.ClassDeclaration) => T;
      createObjectLiteralExpressionVisitor: (
        node: ts.ObjectLiteralExpression,
      ) => T;
    },
  ) {}

  createAdditionalVisitor(node: ts.Node, depth: number): T | undefined {
    if (isTopLevelFunction(this.topLevelDepth, depth, node)) {
      return this.visitors.createFunctionVisitor(node);
    }
    if (isTopLevelArrowFunction(this.topLevelDepth, depth, node)) {
      return this.visitors.createArrowFunctionVisitor(node);
    }
    if (isTopLevelIIFE(this.topLevelDepth, depth, node)) {
      return this.visitors.createIIFEVisitor();
    }
    if (isTopLevelClass(this.topLevelDepth, depth, node)) {
      return this.visitors.createClassVisitor(node);
    }
    if (isTopLevelObjectLiteralExpression(this.topLevelDepth, depth, node)) {
      return this.visitors.createObjectLiteralExpressionVisitor(node);
    }
    return undefined;
  }
}

export class ClassVisitorFactory<T extends AstVisitor> {
  constructor(
    private readonly visitors: {
      createGetAccessorVisitor: (node: ts.GetAccessorDeclaration) => T;
      createSetAccessorVisitor: (node: ts.SetAccessorDeclaration) => T;
      createMethodVisitor: (node: ts.MethodDeclaration) => T;
      createConstructorVisitor: () => T;
    },
  ) {}

  createAdditionalVisitor(node: ts.Node): T | undefined {
    if (ts.isGetAccessor(node)) {
      return this.visitors.createGetAccessorVisitor(node);
    }
    if (ts.isSetAccessor(node)) {
      return this.visitors.createSetAccessorVisitor(node);
    }
    if (ts.isMethodDeclaration(node)) {
      return this.visitors.createMethodVisitor(node);
    }
    if (ts.isConstructorDeclaration(node)) {
      return this.visitors.createConstructorVisitor();
    }
    return undefined;
  }
}
