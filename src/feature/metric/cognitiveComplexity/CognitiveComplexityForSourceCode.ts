import { TopLevelVisitorFactory } from '../VisitorFactory';
import type { MetricsScope } from '../metricsModels';
import CognitiveComplexityAnalyzer from './CognitiveComplexityAnalyzer';
import CognitiveComplexityForNormalNode from './CognitiveComplexityForNormalNode';
import CognitiveComplexityForClass from './CognitiveComplexityForClass';

const createNormal = (name: string, scope: MetricsScope) =>
  new CognitiveComplexityForNormalNode(name, scope);
const createClassVisitor = (name: string, scope: MetricsScope) =>
  new CognitiveComplexityForClass(name, scope);

export default class CognitiveComplexityForSourceCode extends CognitiveComplexityAnalyzer {
  constructor(name: string) {
    super(name, 'file', {
      visitorFactory: new TopLevelVisitorFactory<CognitiveComplexityAnalyzer>(
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
