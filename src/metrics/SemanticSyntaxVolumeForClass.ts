import { MetricsScope } from './Metrics';
import SemanticSyntaxVolume from './SemanticSyntaxVolume';
import SemanticSyntaxVolumeForNormalNode from './SemanticSyntaxVolumeForNormalNode';
import { ClassVisitorFactory } from './VisitorFactory';

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
