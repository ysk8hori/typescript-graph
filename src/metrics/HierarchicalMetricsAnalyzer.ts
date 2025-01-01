import * as ts from 'typescript';
import { AstVisitor, Leave, VisitProps } from './AstTraverser';
import Metrics from './Metrics';
import { VisitorFactory } from './VisitorFactory';

export interface HierarchicalMetris<T> {
  name: string;
  score: T;
  children?: HierarchicalMetris<T>[];
}

export type AnalyzeProps = VisitProps;

export default abstract class HierarchicalMetricsAnalyzer<T>
  implements AstVisitor, Metrics<HierarchicalMetris<T>>
{
  constructor(
    protected name: string,
    param?: {
      topLevelDepth?: number;
      visitorFactory?: VisitorFactory<HierarchicalMetricsAnalyzer<T>>;
    },
  ) {
    this.topLevelDepth = param?.topLevelDepth ?? 1;
    this.#visitorFactory = param?.visitorFactory;
  }
  #visitorFactory?: VisitorFactory<HierarchicalMetricsAnalyzer<T>>;
  protected topLevelDepth: number;

  visit(props: VisitProps) {
    const leave = this.analyze(props);

    const additionalVisitor = this.#visitorFactory?.createAdditionalVisitor(
      props.node,
      props.depth,
    );

    return {
      leave: leave ?? undefined,
      additionalVisitors: [additionalVisitor].filter(v => !!v),
    };
  }

  get metrics(): HierarchicalMetris<T> {
    return {
      name: this.name,
      score: this.score,
      children: this.#visitorFactory?.additionalVisitors
        .filter(v => !!v)
        .map(v => v.metrics),
    };
  }

  protected abstract analyze(props: AnalyzeProps): Leave | void;
  protected abstract score: T;
}
