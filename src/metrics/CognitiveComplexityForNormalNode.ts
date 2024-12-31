import CognitiveComplexity, {
  CognitiveComplexityMetrics,
} from './CognitiveComplexity';

/** NormalNode とは、ソースコード及びトップレベルの Class 以外を想定している。  */
export default class CognitiveComplexityForNormalNode extends CognitiveComplexity {
  get metrics(): CognitiveComplexityMetrics {
    return { name: this.name, score: this.score };
  }
}
