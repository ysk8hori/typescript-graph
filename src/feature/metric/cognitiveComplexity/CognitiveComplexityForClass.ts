import type { MetricsScope } from '../metricsModels';
import { ClassVisitorFactory } from '../VisitorFactory';
import CognitiveComplexityAnalyzer from './CognitiveComplexityAnalyzer';
import CognitiveComplexityForNormalNode from './CognitiveComplexityForNormalNode';

export default class CognitiveComplexityForClass extends CognitiveComplexityAnalyzer {
  constructor(name: string, scope: MetricsScope) {
    super(name, scope, {
      visitorFactory: new ClassVisitorFactory({
        createGetAccessorVisitor: (name, scope) =>
          new CognitiveComplexityForNormalNode(name, scope),
        createSetAccessorVisitor: (name, scope) =>
          new CognitiveComplexityForNormalNode(name, scope),
        createMethodVisitor: (name, scope) =>
          new CognitiveComplexityForNormalNode(name, scope),
        createConstructorVisitor: (name, scope) =>
          new CognitiveComplexityForNormalNode(name, scope),
      }),
    });
  }
}
