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

export interface VisitorFactory<T extends AstVisitor> {
  createAdditionalVisitor(node: ts.Node, depth: number): T | undefined;
  additionalVisitors: T[];
}

export class TopLevelVisitorFactory<T extends AstVisitor>
  implements VisitorFactory<T>
{
  constructor(
    private readonly topLevelDepth: number,
    private readonly factoryMethods: {
      createFunctionVisitor: (name: string) => T;
      createArrowFunctionVisitor: (name: string) => T;
      createIIFEVisitor: (name: string) => T;
      createClassVisitor: (name: string) => T;
      createObjectLiteralExpressionVisitor: (name: string) => T;
    },
  ) {}

  createAdditionalVisitor(node: ts.Node, depth: number): T | undefined {
    if (isTopLevelFunction(this.topLevelDepth, depth, node)) {
      const visitor = this.factoryMethods.createFunctionVisitor(
        getFunctionName(node),
      );
      this.#addVisitor(visitor);
      return visitor;
    }
    if (isTopLevelArrowFunction(this.topLevelDepth, depth, node)) {
      const visitor = this.factoryMethods.createArrowFunctionVisitor(
        getArrowFunctionName(node),
      );
      this.#addVisitor(visitor);
      return visitor;
    }
    if (isTopLevelIIFE(this.topLevelDepth, depth, node)) {
      const visitor = this.factoryMethods.createIIFEVisitor(
        getAnonymousFunctionName(),
      );
      this.#addVisitor(visitor);
      return visitor;
    }
    if (isTopLevelClass(this.topLevelDepth, depth, node)) {
      const visitor = this.factoryMethods.createClassVisitor(
        getClassName(node),
      );
      this.#addVisitor(visitor);
      return visitor;
    }
    if (isTopLevelObjectLiteralExpression(this.topLevelDepth, depth, node)) {
      const visitor = this.factoryMethods.createObjectLiteralExpressionVisitor(
        getObjectName(node),
      );
      this.#addVisitor(visitor);
      return visitor;
    }
    return undefined;
  }

  additionalVisitors: T[] = [];
  #addVisitor(visitor: T) {
    this.additionalVisitors.push(visitor);
  }
}

// テストは CognitiveComplexity.children.spec.ts で行う
export class ClassVisitorFactory<T extends AstVisitor>
  implements VisitorFactory<T>
{
  constructor(
    private readonly factoryMethods: {
      createGetAccessorVisitor: (name: string) => T;
      createSetAccessorVisitor: (name: string) => T;
      createMethodVisitor: (name: string) => T;
      createConstructorVisitor: (name: string) => T;
    },
  ) {}

  createAdditionalVisitor(node: ts.Node): T | undefined {
    if (ts.isGetAccessor(node)) {
      const visitor = this.factoryMethods.createGetAccessorVisitor(
        getGetAccessorName(node),
      );
      this.#addVisitor(visitor);
      return visitor;
    }
    if (ts.isSetAccessor(node)) {
      const visitor = this.factoryMethods.createSetAccessorVisitor(
        getSetAccessorName(node),
      );
      this.#addVisitor(visitor);
      return visitor;
    }
    if (ts.isMethodDeclaration(node)) {
      const visitor = this.factoryMethods.createMethodVisitor(
        getMethodName(node),
      );
      this.#addVisitor(visitor);
      return visitor;
    }
    if (ts.isConstructorDeclaration(node)) {
      const visitor =
        this.factoryMethods.createConstructorVisitor(getConstructorName());
      this.#addVisitor(visitor);
      return visitor;
    }
    return undefined;
  }

  additionalVisitors: T[] = [];
  #addVisitor(visitor: T) {
    this.additionalVisitors.push(visitor);
  }
}
