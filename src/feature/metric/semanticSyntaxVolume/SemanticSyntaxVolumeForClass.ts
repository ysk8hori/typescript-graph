import type { MetricsScope } from '../metricsModels';
import { ClassVisitorFactory } from '../VisitorFactory';
import SemanticSyntaxVolume from './SemanticSyntaxVolumeAnalyzer';
import SemanticSyntaxVolumeForNormalNode from './SemanticSyntaxVolumeForNormalNode';

const create = (name: string, scope: MetricsScope) =>
  new SemanticSyntaxVolumeForNormalNode(name, scope);
export default class SemanticSyntaxVolumeForClass extends SemanticSyntaxVolume {
  constructor(name: string, scope: MetricsScope) {
    super(name, scope, {
      visitorFactory: new ClassVisitorFactory({
        createGetAccessorVisitor: create,
        createSetAccessorVisitor: create,
        createMethodVisitor: create,
        createConstructorVisitor: create,
      }),
    });
  }
}
