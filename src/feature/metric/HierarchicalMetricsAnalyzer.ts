import type { AstVisitor, Leave, VisitProps } from '../util/AstVisitor';
import type { HierarchicalMetris } from './HierarchicalMetris';
import type Metrics from './Metrics';
import type { MetricsScope } from './metricsModels';
import type { VisitorFactory } from './VisitorFactory';

export type AnalyzeProps = VisitProps;

export default abstract class HierarchicalMetricsAnalyzer<T>
  implements AstVisitor, Metrics<HierarchicalMetris<T>>
{
  constructor(
    protected name: string,
    protected scope: MetricsScope,
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
      scope: this.scope,
      score: this.score,
      children: this.#visitorFactory?.additionalVisitors
        .filter(v => !!v)
        .map(v => v.metrics),
    };
  }

  protected abstract analyze(props: AnalyzeProps): Leave | void;
  protected abstract score: T;
}
