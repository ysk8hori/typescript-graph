import CyclomaticComplexity from './CyclomaticComplexity';
import CyclomaticComplexityForNormalNode from './CyclomaticComplexityForNormalNode';
import { ClassVisitorFactory } from './VisitorFactory';

export default class CyclomaticComplexityForClass extends CyclomaticComplexity {
  constructor(name: string) {
    super(name, {
      visitorFactory: new ClassVisitorFactory({
        createGetAccessorVisitor: name =>
          new CyclomaticComplexityForNormalNode(name),
        createSetAccessorVisitor: name =>
          new CyclomaticComplexityForNormalNode(name),
        createMethodVisitor: name =>
          new CyclomaticComplexityForNormalNode(name),
        createConstructorVisitor: name =>
          new CyclomaticComplexityForNormalNode(name),
      }),
    });
  }
}
