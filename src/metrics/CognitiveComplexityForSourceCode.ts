import ts from 'typescript';
import { VisitProps } from './AstTraverser';
import CognitiveComplexity, {
  CognitiveComplexityMetrics,
} from './CognitiveComplexity';
import CognitiveComplexityForNormalNode from './CognitiveComplexityForNormalNode';
import { isTopLevelFunction } from './astUtils';

export default class CognitiveComplexityForSourceCode extends CognitiveComplexity {
  constructor(private name: string) {
    super();
  }
  visit({ node, depth, sourceFile }: VisitProps) {
    const superResult = super.visit({ node, depth, sourceFile });
    if (
      isTopLevelFunction({
        topLevelDepth: this.topLevelDepth,
        currentDepth: depth,
        node,
      })
    ) {
      const cognitiveComplexity = new CognitiveComplexityForNormalNode(
        node
          .getChildren()
          .find(n => ts.isIdentifier(n))
          ?.getText(node.getSourceFile()) ?? 'unknown name',
      );
      this.#additionalVisitors.push(cognitiveComplexity);
      return {
        leave: prop => {
          superResult?.leave?.(prop);
        },
        additionalVisitors: [cognitiveComplexity],
      };
    }
    return superResult;
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
