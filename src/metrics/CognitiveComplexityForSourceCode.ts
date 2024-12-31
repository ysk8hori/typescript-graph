import ts from 'typescript';
import { VisitProps } from './AstTraverser';
import CognitiveComplexity, {
  CognitiveComplexityMetrics,
} from './CognitiveComplexity';
import CognitiveComplexityForNormalNode from './CognitiveComplexityForNormalNode';
import {
  getArrowFunctionName,
  getFunctionName,
  isTopLevelArrowFunction,
  isTopLevelFunction,
} from './astUtils';

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
  return undefined;
}

export default class CognitiveComplexityForSourceCode extends CognitiveComplexity {
  constructor(private name: string) {
    super();
  }
  visit({ node, depth, sourceFile }: VisitProps) {
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
