import CognitiveComplexity from './CognitiveComplexity';

/** NormalNode とは、ソースコード及びトップレベルの Class 以外を想定している。  */
export default class CognitiveComplexityForNormalNode extends CognitiveComplexity {
  createAdditionalVisitor(): undefined {
    return undefined;
  }
}
