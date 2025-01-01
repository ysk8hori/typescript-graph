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
    super(name, {
      visitorFactory: new TopLevelVisitorFactory<SemanticSyntaxVolume>(
        param?.topLevelDepth ?? 1,
        {
          createFunctionVisitor: name =>
            new SemanticSyntaxVolumeForNormalNode(name),
          createArrowFunctionVisitor: name =>
            new SemanticSyntaxVolumeForNormalNode(name),
          createIIFEVisitor: name =>
            new SemanticSyntaxVolumeForNormalNode(name),
          createClassVisitor: name => new SemanticSyntaxVolumeForClass(name),
          createObjectLiteralExpressionVisitor: name =>
            new SemanticSyntaxVolumeForNormalNode(name),
        },
      ),
    });
  }
}
