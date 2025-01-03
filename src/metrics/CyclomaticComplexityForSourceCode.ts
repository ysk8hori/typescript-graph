import CyclomaticComplexity from './CyclomaticComplexity';
import CyclomaticComplexityForNormalNode from './CyclomaticComplexityForNormalNode';
import CyclomaticComplexityForClass from './CyclomaticComplexityForClass';
import { TopLevelVisitorFactory, VisitorFactory } from './VisitorFactory';
import { MetricsScope } from './Metrics';

export default class CyclomaticComplexityForSourceCode extends CyclomaticComplexity {
  constructor(
    name: string,
    param?: {
      topLevelDepth?: number;
      visitorFactory?: VisitorFactory<CyclomaticComplexity>;
    },
  ) {
    super(name, 'file', {
      visitorFactory: new TopLevelVisitorFactory<CyclomaticComplexity>(
        param?.topLevelDepth ?? 1,
        {
          createFunctionVisitor: (name, scope) =>
            new CyclomaticComplexityForNormalNode(name, scope),
          createArrowFunctionVisitor: (name, scope) =>
            new CyclomaticComplexityForNormalNode(name, scope),
          createIIFEVisitor: (name, scope) =>
            new CyclomaticComplexityForNormalNode(name, scope),
          createClassVisitor: (name, scope) =>
            new CyclomaticComplexityForClass(name, scope),
          createObjectLiteralExpressionVisitor: (name, scope) =>
            new CyclomaticComplexityForNormalNode(name, scope),
        },
      ),
    });
  }
}
