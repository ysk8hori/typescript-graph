import { TopLevelVisitorFactory } from '../VisitorFactory';
import SemanticSyntaxVolume from './SemanticSyntaxVolumeAnalyzer';
import SemanticSyntaxVolumeForClass from './SemanticSyntaxVolumeForClass';
import SemanticSyntaxVolumeForNormalNode from './SemanticSyntaxVolumeForNormalNode';

export default class SemanticSyntaxVolumeForSourceCode extends SemanticSyntaxVolume {
  constructor(name: string) {
    super(name, 'file', {
      visitorFactory: new TopLevelVisitorFactory<SemanticSyntaxVolume>(1, {
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
      }),
    });
  }
}
