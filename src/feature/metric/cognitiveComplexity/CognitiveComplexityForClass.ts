import type { MetricsScope } from '../metricsModels';
import { ClassVisitorFactory } from '../VisitorFactory';
import CognitiveComplexityAnalyzer from './CognitiveComplexityAnalyzer';
import CognitiveComplexityForNormalNode from './CognitiveComplexityForNormalNode';

const create = (name: string, scope: MetricsScope) =>
  new CognitiveComplexityForNormalNode(name, scope);

export default class CognitiveComplexityForClass extends CognitiveComplexityAnalyzer {
  constructor(name: string, scope: MetricsScope) {
    super(name, scope, {
      visitorFactory: new ClassVisitorFactory({
        createGetAccessorVisitor: create,
        createSetAccessorVisitor: create,
        createMethodVisitor: create,
        createConstructorVisitor: create,
      }),
    });
  }
}
