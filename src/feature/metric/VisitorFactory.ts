import ts from 'typescript';
import type { AstVisitor } from '../util/AstVisitor';
import * as astUtils from '../util/astUtils';
import type { MetricsScope } from './metricsModels';

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
      createTypeAliasDeclarationVisitor: (
        name: string,
        scope: MetricsScope,
      ) => T;
      createInterfaceDeclarationVisitor: (
        name: string,
        scope: MetricsScope,
      ) => T;
    },
  ) {}

  createAdditionalVisitor(node: ts.Node, depth: number): T | undefined {
    if (astUtils.isTopLevelFunction(this.topLevelDepth, depth, node)) {
      const visitor = this.factoryMethods.createFunctionVisitor(
        astUtils.getFunctionName(node),
        'function',
      );
      this.#addVisitor(visitor);
      return visitor;
    }
    if (astUtils.isTopLevelArrowFunction(this.topLevelDepth, depth, node)) {
      const visitor = this.factoryMethods.createArrowFunctionVisitor(
        astUtils.getArrowFunctionName(node),
        'function',
      );
      this.#addVisitor(visitor);
      return visitor;
    }
    if (astUtils.isTopLevelIIFE(this.topLevelDepth, depth, node)) {
      const visitor = this.factoryMethods.createIIFEVisitor(
        astUtils.getAnonymousFunctionName(),
        'function',
      );
      this.#addVisitor(visitor);
      return visitor;
    }
    if (astUtils.isTopLevelClass(this.topLevelDepth, depth, node)) {
      const visitor = this.factoryMethods.createClassVisitor(
        astUtils.getClassName(node),
        'class',
      );
      this.#addVisitor(visitor);
      return visitor;
    }
    if (
      astUtils.isTopLevelObjectLiteralExpression(
        this.topLevelDepth,
        depth,
        node,
      )
    ) {
      const visitor = this.factoryMethods.createObjectLiteralExpressionVisitor(
        astUtils.getObjectName(node),
        'object',
      );
      this.#addVisitor(visitor);
      return visitor;
    }
    if (astUtils.isTopLevelTypeAlias(this.topLevelDepth, depth, node)) {
      const visitor = this.factoryMethods.createTypeAliasDeclarationVisitor(
        astUtils.getTypeAliasName(node),
        'type',
      );
      this.#addVisitor(visitor);
      return visitor;
    }
    if (astUtils.isTopLevelInterface(this.topLevelDepth, depth, node)) {
      const visitor = this.factoryMethods.createInterfaceDeclarationVisitor(
        astUtils.getInterfaceName(node),
        'interface',
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
        astUtils.getGetAccessorName(node),
        'method',
      );
      this.#addVisitor(visitor);
      return visitor;
    }
    if (ts.isSetAccessor(node)) {
      const visitor = this.factoryMethods.createSetAccessorVisitor(
        astUtils.getSetAccessorName(node),
        'method',
      );
      this.#addVisitor(visitor);
      return visitor;
    }
    if (ts.isMethodDeclaration(node)) {
      const visitor = this.factoryMethods.createMethodVisitor(
        astUtils.getMethodName(node),
        'method',
      );
      this.#addVisitor(visitor);
      return visitor;
    }
    if (ts.isConstructorDeclaration(node)) {
      const visitor = this.factoryMethods.createConstructorVisitor(
        astUtils.getConstructorName(),
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
