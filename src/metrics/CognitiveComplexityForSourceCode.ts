import ts from 'typescript';
import CognitiveComplexity from './CognitiveComplexity';
import CognitiveComplexityForNormalNode from './CognitiveComplexityForNormalNode';
import CognitiveComplexityForClass from './CognitiveComplexityForClass';
import { TopLevelVisitorFactory } from './VisitorFactory';

export default class CognitiveComplexityForSourceCode extends CognitiveComplexity {
  #factory = new TopLevelVisitorFactory<CognitiveComplexity>(
    this.topLevelDepth,
    {
      createFunctionVisitor: name => new CognitiveComplexityForNormalNode(name),
      createArrowFunctionVisitor: name =>
        new CognitiveComplexityForNormalNode(name),
      createIIFEVisitor: name => new CognitiveComplexityForNormalNode(name),
      createClassVisitor: name => new CognitiveComplexityForClass(name),
      createObjectLiteralExpressionVisitor: name =>
        new CognitiveComplexityForNormalNode(name),
    },
  );
  createAdditionalVisitor(
    node: ts.Node,
    depth: number,
  ): CognitiveComplexity | undefined {
    return this.#factory.createAdditionalVisitor(node, depth);
  }
}
