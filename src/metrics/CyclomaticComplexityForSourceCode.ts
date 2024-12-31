import CyclomaticComplexity from './CyclomaticComplexity';
import CyclomaticComplexityForNormalNode from './CyclomaticComplexityForNormalNode';
import CyclomaticComplexityForClass from './CyclomaticComplexityForClass';
import { TopLevelVisitorFactory, VisitorFactory } from './VisitorFactory';

export default class CyclomaticComplexityForSourceCode extends CyclomaticComplexity {
  constructor(
    name: string,
    param?: {
      topLevelDepth?: number;
      visitorFactory?: VisitorFactory<CyclomaticComplexity>;
    },
  ) {
    super(name, {
      visitorFactory: new TopLevelVisitorFactory<CyclomaticComplexity>(
        param?.topLevelDepth ?? 1,
        {
          createFunctionVisitor: name =>
            new CyclomaticComplexityForNormalNode(name),
          createArrowFunctionVisitor: name =>
            new CyclomaticComplexityForNormalNode(name),
          createIIFEVisitor: name =>
            new CyclomaticComplexityForNormalNode(name),
          createClassVisitor: name => new CyclomaticComplexityForClass(name),
          createObjectLiteralExpressionVisitor: name =>
            new CyclomaticComplexityForNormalNode(name),
        },
      ),
    });
  }
}
