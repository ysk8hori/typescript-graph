import type { MetricsScope } from '../metricsModels';
import { TopLevelVisitorFactory } from '../VisitorFactory';
import SemanticSyntaxVolume from './SemanticSyntaxVolumeAnalyzer';
import SemanticSyntaxVolumeForClass from './SemanticSyntaxVolumeForClass';
import SemanticSyntaxVolumeForNormalNode from './SemanticSyntaxVolumeForNormalNode';

const createNormal = (name: string, scope: MetricsScope) =>
  new SemanticSyntaxVolumeForNormalNode(name, scope);
const createClassVisitor = (name: string, scope: MetricsScope) =>
  new SemanticSyntaxVolumeForClass(name, scope);

export default class SemanticSyntaxVolumeForSourceCode extends SemanticSyntaxVolume {
  constructor(name: string) {
    super(name, 'file', {
      visitorFactory: new TopLevelVisitorFactory<SemanticSyntaxVolume>(1, {
        createFunctionVisitor: createNormal,
        createArrowFunctionVisitor: createNormal,
        createIIFEVisitor: createNormal,
        createObjectLiteralExpressionVisitor: createNormal,
        createInterfaceDeclarationVisitor: createNormal,
        createTypeAliasDeclarationVisitor: createNormal,
        createClassVisitor,
      }),
    });
  }
}
