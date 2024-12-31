import ts from 'typescript';
import { VisitProps, VisitResult } from './AstTraverser';
import CognitiveComplexity, {
  CognitiveComplexityMetrics,
} from './CognitiveComplexity';
import CognitiveComplexityForNormalNode from './CognitiveComplexityForNormalNode';
import {
  getGetAccessorName,
  getMethodName,
  getSetAccessorName,
} from './astUtils';

function createAdditionalVisitor(
  node: ts.Node,
): CognitiveComplexity | undefined {
  if (ts.isGetAccessor(node)) {
    return new CognitiveComplexityForNormalNode(getGetAccessorName(node));
  }
  if (ts.isSetAccessor(node)) {
    return new CognitiveComplexityForNormalNode(getSetAccessorName(node));
  }
  if (ts.isMethodDeclaration(node)) {
    return new CognitiveComplexityForNormalNode(getMethodName(node));
  }
  return undefined;
}

export default class CognitiveComplexityForClass extends CognitiveComplexity {
  constructor(private name: string) {
    super();
  }
  visit({ node, depth, sourceFile }: VisitProps): void | VisitResult {
    const superResult = super.visit({ node, depth, sourceFile });
    const additionalVisitor = createAdditionalVisitor(node);

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
