import ts from 'typescript';
import { AstVisitor } from './AstTraverser';
import {
  getAnonymousFunctionName,
  getArrowFunctionName,
  getClassName,
  getConstructorName,
  getFunctionName,
  getGetAccessorName,
  getMethodName,
  getObjectName,
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
      createFunctionVisitor: (name: string) => T;
      createArrowFunctionVisitor: (name: string) => T;
      createIIFEVisitor: (name: string) => T;
      createClassVisitor: (name: string) => T;
      createObjectLiteralExpressionVisitor: (name: string) => T;
    },
  ) {}

  createAdditionalVisitor(node: ts.Node, depth: number): T | undefined {
    if (isTopLevelFunction(this.topLevelDepth, depth, node)) {
      return this.visitors.createFunctionVisitor(getFunctionName(node));
    }
    if (isTopLevelArrowFunction(this.topLevelDepth, depth, node)) {
      return this.visitors.createArrowFunctionVisitor(
        getArrowFunctionName(node),
      );
    }
    if (isTopLevelIIFE(this.topLevelDepth, depth, node)) {
      return this.visitors.createIIFEVisitor(getAnonymousFunctionName());
    }
    if (isTopLevelClass(this.topLevelDepth, depth, node)) {
      return this.visitors.createClassVisitor(getClassName(node));
    }
    if (isTopLevelObjectLiteralExpression(this.topLevelDepth, depth, node)) {
      return this.visitors.createObjectLiteralExpressionVisitor(
        getObjectName(node),
      );
    }
    return undefined;
  }
}

export class ClassVisitorFactory<T extends AstVisitor> {
  constructor(
    private readonly visitors: {
      createGetAccessorVisitor: (name: string) => T;
      createSetAccessorVisitor: (name: string) => T;
      createMethodVisitor: (name: string) => T;
      createConstructorVisitor: (name: string) => T;
    },
  ) {}

  createAdditionalVisitor(node: ts.Node): T | undefined {
    if (ts.isGetAccessor(node)) {
      return this.visitors.createGetAccessorVisitor(getGetAccessorName(node));
    }
    if (ts.isSetAccessor(node)) {
      return this.visitors.createSetAccessorVisitor(getSetAccessorName(node));
    }
    if (ts.isMethodDeclaration(node)) {
      return this.visitors.createMethodVisitor(getMethodName(node));
    }
    if (ts.isConstructorDeclaration(node)) {
      return this.visitors.createConstructorVisitor(getConstructorName());
    }
    return undefined;
  }
}
