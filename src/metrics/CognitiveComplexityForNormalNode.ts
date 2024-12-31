import CognitiveComplexity from './CognitiveComplexity';

/** NormalNode とは、ソースコード及びトップレベルの Class 以外を想定している。  */
export default class CognitiveComplexityForNormalNode extends CognitiveComplexity {
  constructor(name: string) {
    super();
    this.#name = name;
  }

  #name: string;

  get metrics() {
    return { name: this.#name, score: this.score };
  }
}
