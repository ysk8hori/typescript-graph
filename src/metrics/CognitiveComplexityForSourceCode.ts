import CognitiveComplexity from './CognitiveComplexity';
import CognitiveComplexityForNormalNode from './CognitiveComplexityForNormalNode';
import CognitiveComplexityForClass from './CognitiveComplexityForClass';
import { TopLevelVisitorFactory, VisitorFactory } from './VisitorFactory';
import { MetricsScope } from './Metrics';

export default class CognitiveComplexityForSourceCode extends CognitiveComplexity {
  constructor(
    name: string,
    param?: {
      topLevelDepth?: number;
      visitorFactory?: VisitorFactory<CognitiveComplexity>;
    },
  ) {
    super(name, 'file', {
      visitorFactory: new TopLevelVisitorFactory<CognitiveComplexity>(
        param?.topLevelDepth ?? 1,
        {
          createFunctionVisitor: (name, scope) =>
            new CognitiveComplexityForNormalNode(name, scope),
          createArrowFunctionVisitor: (name, scope) =>
            new CognitiveComplexityForNormalNode(name, scope),
          createIIFEVisitor: (name, scope) =>
            new CognitiveComplexityForNormalNode(name, scope),
          createClassVisitor: (name, scope) =>
            new CognitiveComplexityForClass(name, scope),
          createObjectLiteralExpressionVisitor: (name, scope) =>
            new CognitiveComplexityForNormalNode(name, scope),
        },
      ),
    });
  }
}
