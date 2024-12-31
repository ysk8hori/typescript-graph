import ts from 'typescript';
import CognitiveComplexity from './CognitiveComplexity';
import CognitiveComplexityForNormalNode from './CognitiveComplexityForNormalNode';
import {
  getAnonymousFunctionName,
  getArrowFunctionName,
  getClassName,
  getFunctionName,
  getObjectName,
} from './astUtils';
import CognitiveComplexityForClass from './CognitiveComplexityForClass';
import { TopLevelVisitorFactory } from './VisitorFactory';

export default class CognitiveComplexityForSourceCode extends CognitiveComplexity {
  #factory = new TopLevelVisitorFactory<CognitiveComplexity>(
    this.topLevelDepth,
    {
      createFunctionVisitor: node =>
        new CognitiveComplexityForNormalNode(getFunctionName(node)),
      createArrowFunctionVisitor: node =>
        new CognitiveComplexityForNormalNode(getArrowFunctionName(node)),
      createIIFEVisitor: () =>
        new CognitiveComplexityForNormalNode(getAnonymousFunctionName()),
      createClassVisitor: node =>
        new CognitiveComplexityForClass(getClassName(node)),
      createObjectLiteralExpressionVisitor: node =>
        new CognitiveComplexityForNormalNode(getObjectName(node)),
    },
  );
  createAdditionalVisitor(
    node: ts.Node,
    depth: number,
  ): CognitiveComplexity | undefined {
    return this.#factory.createAdditionalVisitor(node, depth);
  }
}
