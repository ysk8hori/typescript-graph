import CognitiveComplexity from './CognitiveComplexity';
import CognitiveComplexityForNormalNode from './CognitiveComplexityForNormalNode';
import { ClassVisitorFactory } from './VisitorFactory';

export default class CognitiveComplexityForClass extends CognitiveComplexity {
  constructor(name: string) {
    super(name, {
      visitorFactory: new ClassVisitorFactory({
        createGetAccessorVisitor: name =>
          new CognitiveComplexityForNormalNode(name),
        createSetAccessorVisitor: name =>
          new CognitiveComplexityForNormalNode(name),
        createMethodVisitor: name => new CognitiveComplexityForNormalNode(name),
        createConstructorVisitor: name =>
          new CognitiveComplexityForNormalNode(name),
      }),
    });
  }
}
