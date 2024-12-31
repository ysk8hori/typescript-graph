import ts from 'typescript';
import { VisitProps, VisitResult } from './AstTraverser';
import CognitiveComplexity, {
  CognitiveComplexityMetrics,
} from './CognitiveComplexity';
import CognitiveComplexityForNormalNode from './CognitiveComplexityForNormalNode';
import {
  getAnonymousFunctionName,
  getArrowFunctionName,
  getClassName,
  getFunctionName,
  getObjectName,
  isTopLevelArrowFunction,
  isTopLevelClass,
  isTopLevelFunction,
  isTopLevelIIFE,
  isTopLevelObjectLiteralExpression,
} from './astUtils';
import CognitiveComplexityForClass from './CognitiveComplexityForClass';

function createAdditionalVisitor(
  topLevelDepth: number,
  depth: number,
  node: ts.Node,
): CognitiveComplexity | undefined {
  if (isTopLevelFunction(topLevelDepth, depth, node)) {
    return new CognitiveComplexityForNormalNode(getFunctionName(node));
  }
  if (isTopLevelArrowFunction(topLevelDepth, depth, node)) {
    return new CognitiveComplexityForNormalNode(getArrowFunctionName(node));
  }
  if (isTopLevelIIFE(topLevelDepth, depth, node)) {
    return new CognitiveComplexityForNormalNode(getAnonymousFunctionName());
  }
  if (isTopLevelClass(topLevelDepth, depth, node)) {
    return new CognitiveComplexityForClass(getClassName(node));
  }
  if (isTopLevelObjectLiteralExpression(topLevelDepth, depth, node)) {
    return new CognitiveComplexityForClass(getObjectName(node));
  }
  return undefined;
}

export default class CognitiveComplexityForSourceCode extends CognitiveComplexity {
  constructor(private name: string) {
    super();
  }
  visit({ node, depth, sourceFile }: VisitProps): void | VisitResult {
    const superResult = super.visit({ node, depth, sourceFile });
    const additionalVisitor = createAdditionalVisitor(
      this.topLevelDepth,
      depth,
      node,
    );

    if (!additionalVisitor) {
      return superResult;
    }

    this.#additionalVisitors.push(additionalVisitor);
    return {
      leave: prop => {
        superResult?.leave?.(prop);
      },
      additionalVisitors: [additionalVisitor],
    };
  }
  #additionalVisitors: CognitiveComplexity[] = [];

  get metrics(): CognitiveComplexityMetrics {
    return {
      name: this.name,
      score: this.score,
      children: this.#additionalVisitors.map(visitor => visitor.metrics),
    };
  }
}
