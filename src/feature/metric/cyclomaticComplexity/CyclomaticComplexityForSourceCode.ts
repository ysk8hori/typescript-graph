import { TopLevelVisitorFactory } from '../VisitorFactory';
import type { MetricsScope } from '../metricsModels';
import CyclomaticComplexityAnalyzer from './CyclomaticComplexityAnalyzer';
import CyclomaticComplexityForNormalNode from './CyclomaticComplexityForNormalNode';
import CyclomaticComplexityForClass from './CyclomaticComplexityForClass';

const createNormal = (name: string, scope: MetricsScope) =>
  new CyclomaticComplexityForNormalNode(name, scope);
const createClassVisitor = (name: string, scope: MetricsScope) =>
  new CyclomaticComplexityForClass(name, scope);

export default class CyclomaticComplexityForSourceCode extends CyclomaticComplexityAnalyzer {
  constructor(name: string) {
    super(name, 'file', {
      visitorFactory: new TopLevelVisitorFactory<CyclomaticComplexityAnalyzer>(
        1,
        {
          createFunctionVisitor: createNormal,
          createArrowFunctionVisitor: createNormal,
          createIIFEVisitor: createNormal,
          createObjectLiteralExpressionVisitor: createNormal,
          createClassVisitor,
        },
      ),
    });
  }
}
