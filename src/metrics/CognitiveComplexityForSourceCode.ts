import CognitiveComplexity from './CognitiveComplexity';
import CognitiveComplexityForNormalNode from './CognitiveComplexityForNormalNode';
import CognitiveComplexityForClass from './CognitiveComplexityForClass';
import { TopLevelVisitorFactory, VisitorFactory } from './VisitorFactory';

export default class CognitiveComplexityForSourceCode extends CognitiveComplexity {
  constructor(
    name: string,
    param?: {
      topLevelDepth?: number;
      visitorFactory?: VisitorFactory<CognitiveComplexity>;
    },
  ) {
    super(name, {
      visitorFactory: new TopLevelVisitorFactory<CognitiveComplexity>(
        param?.topLevelDepth ?? 1,
        {
          createFunctionVisitor: name =>
            new CognitiveComplexityForNormalNode(name),
          createArrowFunctionVisitor: name =>
            new CognitiveComplexityForNormalNode(name),
          createIIFEVisitor: name => new CognitiveComplexityForNormalNode(name),
          createClassVisitor: name => new CognitiveComplexityForClass(name),
          createObjectLiteralExpressionVisitor: name =>
            new CognitiveComplexityForNormalNode(name),
        },
      ),
    });
  }
}
