import { TopLevelVisitorFactory } from '../VisitorFactory';
import CyclomaticComplexityAnalyzer from './CyclomaticComplexityAnalyzer';
import CyclomaticComplexityForNormalNode from './CyclomaticComplexityForNormalNode';
import CyclomaticComplexityForClass from './CyclomaticComplexityForClass';

export default class CyclomaticComplexityForSourceCode extends CyclomaticComplexityAnalyzer {
  constructor(name: string) {
    super(name, 'file', {
      visitorFactory: new TopLevelVisitorFactory<CyclomaticComplexityAnalyzer>(
        1,
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
