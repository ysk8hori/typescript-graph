import ts from 'typescript';
import CognitiveComplexity from './CognitiveComplexity';
import CognitiveComplexityForNormalNode from './CognitiveComplexityForNormalNode';
import {
  getConstructorName,
  getGetAccessorName,
  getMethodName,
  getSetAccessorName,
} from './astUtils';
import { ClassVisitorFactory } from './VisitorFactory';

export default class CognitiveComplexityForClass extends CognitiveComplexity {
  #factory = new ClassVisitorFactory({
    createGetAccessorVisitor: node =>
      new CognitiveComplexityForNormalNode(getGetAccessorName(node)),
    createSetAccessorVisitor: node =>
      new CognitiveComplexityForNormalNode(getSetAccessorName(node)),
    createMethodVisitor: node =>
      new CognitiveComplexityForNormalNode(getMethodName(node)),
    createConstructorVisitor: () =>
      new CognitiveComplexityForNormalNode(getConstructorName()),
  });
  createAdditionalVisitor(node: ts.Node): CognitiveComplexity | undefined {
    return this.#factory.createAdditionalVisitor(node);
  }
}
