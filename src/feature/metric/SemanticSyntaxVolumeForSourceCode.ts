import SemanticSyntaxVolume from './SemanticSyntaxVolume';
import SemanticSyntaxVolumeForClass from './SemanticSyntaxVolumeForClass';
import SemanticSyntaxVolumeForNormalNode from './SemanticSyntaxVolumeForNormalNode';
import { VisitorFactory, TopLevelVisitorFactory } from './VisitorFactory';

export default class SemanticSyntaxVolumeForSourceCode extends SemanticSyntaxVolume {
  constructor(
    name: string,
    param?: {
      topLevelDepth?: number;
      visitorFactory?: VisitorFactory<SemanticSyntaxVolume>;
    },
  ) {
    super(name, 'file', {
      visitorFactory: new TopLevelVisitorFactory<SemanticSyntaxVolume>(
        param?.topLevelDepth ?? 1,
        {
          createFunctionVisitor: (name, scope) =>
            new SemanticSyntaxVolumeForNormalNode(name, scope),
          createArrowFunctionVisitor: (name, scope) =>
            new SemanticSyntaxVolumeForNormalNode(name, scope),
          createIIFEVisitor: (name, scope) =>
            new SemanticSyntaxVolumeForNormalNode(name, scope),
          createClassVisitor: (name, scope) =>
            new SemanticSyntaxVolumeForClass(name, scope),
          createObjectLiteralExpressionVisitor: (name, scope) =>
            new SemanticSyntaxVolumeForNormalNode(name, scope),
        },
      ),
    });
  }
}
