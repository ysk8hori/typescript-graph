import CyclomaticComplexityAnalyzer from './CyclomaticComplexityAnalyzer';
import CyclomaticComplexityForNormalNode from './CyclomaticComplexityForNormalNode';
import type { MetricsScope } from '../metricsModels';
import { ClassVisitorFactory } from '../VisitorFactory';

export default class CyclomaticComplexityForClass extends CyclomaticComplexityAnalyzer {
  constructor(name: string, scope: MetricsScope) {
    super(name, scope, {
      visitorFactory: new ClassVisitorFactory({
        createGetAccessorVisitor: (name, scope) =>
          new CyclomaticComplexityForNormalNode(name, scope),
        createSetAccessorVisitor: (name, scope) =>
          new CyclomaticComplexityForNormalNode(name, scope),
        createMethodVisitor: (name, scope) =>
          new CyclomaticComplexityForNormalNode(name, scope),
        createConstructorVisitor: (name, scope) =>
          new CyclomaticComplexityForNormalNode(name, scope),
      }),
    });
  }
}
