import SemanticSyntaxVolume from './SemanticSyntaxVolume';
import SemanticSyntaxVolumeForNormalNode from './SemanticSyntaxVolumeForNormalNode';
import { ClassVisitorFactory } from './VisitorFactory';

const create = (name: string) => new SemanticSyntaxVolumeForNormalNode(name);
export default class SemanticSyntaxVolumeForClass extends SemanticSyntaxVolume {
  constructor(name: string) {
    super(name, {
      visitorFactory: new ClassVisitorFactory({
        createGetAccessorVisitor: create,
        createSetAccessorVisitor: create,
        createMethodVisitor: create,
        createConstructorVisitor: create,
      }),
    });
  }
}
