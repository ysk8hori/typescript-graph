import type { MetricsScope } from '../metricsModels';
import { ClassVisitorFactory } from '../VisitorFactory';
import CyclomaticComplexityAnalyzer from './CyclomaticComplexityAnalyzer';
import CyclomaticComplexityForNormalNode from './CyclomaticComplexityForNormalNode';

const create = (name: string, scope: MetricsScope) =>
  new CyclomaticComplexityForNormalNode(name, scope);

export default class CyclomaticComplexityForClass extends CyclomaticComplexityAnalyzer {
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
