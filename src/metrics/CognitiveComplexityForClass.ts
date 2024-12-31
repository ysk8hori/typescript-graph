import ts from 'typescript';
import { VisitProps, VisitResult } from './AstTraverser';
import CognitiveComplexity from './CognitiveComplexity';
import CognitiveComplexityForNormalNode from './CognitiveComplexityForNormalNode';
import {
  getConstructorName,
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
  if (ts.isConstructorDeclaration(node)) {
    return new CognitiveComplexityForNormalNode(getConstructorName());
  }
  return undefined;
}

export default class CognitiveComplexityForClass extends CognitiveComplexity {
  visit({ node, depth, sourceFile }: VisitProps): void | VisitResult {
    const superResult = super.visit({ node, depth, sourceFile });
    const additionalVisitor = createAdditionalVisitor(node);

    if (!additionalVisitor) {
      return superResult;
    }

    this.additionalVisitors.push(additionalVisitor);
    return {
      leave: prop => {
        superResult?.leave?.(prop);
      },
      additionalVisitors: [additionalVisitor],
    };
  }
}
