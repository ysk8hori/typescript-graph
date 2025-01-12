import ts from 'typescript';
import { AstVisitor } from './AstVisitor';
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
import { MetricsScope } from './metricsModels';

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
      createFunctionVisitor: (name: string, scope: MetricsScope) => T;
      createArrowFunctionVisitor: (name: string, scope: MetricsScope) => T;
      createIIFEVisitor: (name: string, scope: MetricsScope) => T;
      createClassVisitor: (name: string, scope: MetricsScope) => T;
      createObjectLiteralExpressionVisitor: (
        name: string,
        scope: MetricsScope,
      ) => T;
    },
  ) {}

  createAdditionalVisitor(node: ts.Node, depth: number): T | undefined {
    if (isTopLevelFunction(this.topLevelDepth, depth, node)) {
      const visitor = this.factoryMethods.createFunctionVisitor(
        getFunctionName(node),
        'function',
      );
      this.#addVisitor(visitor);
      return visitor;
    }
    if (isTopLevelArrowFunction(this.topLevelDepth, depth, node)) {
      const visitor = this.factoryMethods.createArrowFunctionVisitor(
        getArrowFunctionName(node),
        'function',
      );
      this.#addVisitor(visitor);
      return visitor;
    }
    if (isTopLevelIIFE(this.topLevelDepth, depth, node)) {
      const visitor = this.factoryMethods.createIIFEVisitor(
        getAnonymousFunctionName(),
        'function',
      );
      this.#addVisitor(visitor);
      return visitor;
    }
    if (isTopLevelClass(this.topLevelDepth, depth, node)) {
      const visitor = this.factoryMethods.createClassVisitor(
        getClassName(node),
        'class',
      );
      this.#addVisitor(visitor);
      return visitor;
    }
    if (isTopLevelObjectLiteralExpression(this.topLevelDepth, depth, node)) {
      const visitor = this.factoryMethods.createObjectLiteralExpressionVisitor(
        getObjectName(node),
        'object',
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
      createGetAccessorVisitor: (name: string, scope: MetricsScope) => T;
      createSetAccessorVisitor: (name: string, scope: MetricsScope) => T;
      createMethodVisitor: (name: string, scope: MetricsScope) => T;
      createConstructorVisitor: (name: string, scope: MetricsScope) => T;
    },
  ) {}

  createAdditionalVisitor(node: ts.Node): T | undefined {
    if (ts.isGetAccessor(node)) {
      const visitor = this.factoryMethods.createGetAccessorVisitor(
        getGetAccessorName(node),
        'method',
      );
      this.#addVisitor(visitor);
      return visitor;
    }
    if (ts.isSetAccessor(node)) {
      const visitor = this.factoryMethods.createSetAccessorVisitor(
        getSetAccessorName(node),
        'method',
      );
      this.#addVisitor(visitor);
      return visitor;
    }
    if (ts.isMethodDeclaration(node)) {
      const visitor = this.factoryMethods.createMethodVisitor(
        getMethodName(node),
        'method',
      );
      this.#addVisitor(visitor);
      return visitor;
    }
    if (ts.isConstructorDeclaration(node)) {
      const visitor = this.factoryMethods.createConstructorVisitor(
        getConstructorName(),
        'method',
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
