import { TopLevelVisitorFactory } from '../VisitorFactory';
import CognitiveComplexityAnalyzer from './CognitiveComplexityAnalyzer';
import CognitiveComplexityForNormalNode from './CognitiveComplexityForNormalNode';
import CognitiveComplexityForClass from './CognitiveComplexityForClass';

export default class CognitiveComplexityForSourceCode extends CognitiveComplexityAnalyzer {
  constructor(name: string) {
    super(name, 'file', {
      visitorFactory: new TopLevelVisitorFactory<CognitiveComplexityAnalyzer>(
        1,
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
