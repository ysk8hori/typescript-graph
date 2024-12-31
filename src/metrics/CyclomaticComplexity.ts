import * as ts from 'typescript';
import { AstVisitor, VisitProps } from './AstTraverser';
import Metrics from './Metrics';
import { VisitorFactory } from './VisitorFactory';

function kindMatcher(kind: ts.SyntaxKind) {
  return (node: ts.Node) => node.kind === kind;
}

const cyclomaticNodeMatchers: ((node: ts.Node) => boolean)[] = [
  ts.isConditionalExpression,
  ts.isQuestionDotToken,
  ts.isNullishCoalesce,
  kindMatcher(ts.SyntaxKind.QuestionQuestionEqualsToken),
  kindMatcher(ts.SyntaxKind.BarBarEqualsToken),
  ts.isIfStatement,
  ts.isCaseClause,
  ts.isForStatement,
  ts.isForInStatement,
  ts.isForOfStatement,
  ts.isWhileStatement,
  ts.isDoStatement,
  ts.isCatchClause,
  ts.isConditionalTypeNode,
];

export interface CyclomaticComplexityMetrics {
  name: string;
  score: number;
  children?: CyclomaticComplexityMetrics[];
}

export default abstract class CyclomaticComplexity
  implements AstVisitor, Metrics<CyclomaticComplexityMetrics>
{
  constructor(
    protected name: string,
    param?: {
      topLevelDepth?: number;
      visitorFactory?: VisitorFactory<CyclomaticComplexity>;
    },
  ) {
    this.topLevelDepth = param?.topLevelDepth ?? 1;
    this.#visitorFactory = param?.visitorFactory;
  }
  #visitorFactory?: VisitorFactory<CyclomaticComplexity>;
  protected topLevelDepth: number;

  visit({ node, depth }: VisitProps) {
    if (cyclomaticNodeMatchers.some(matcher => matcher(node))) this.#addPath();

    const additionalVisitor = this.#visitorFactory?.createAdditionalVisitor(
      node,
      depth,
    );

    return {
      additionalVisitors: [additionalVisitor].filter(v => !!v),
    };
  }

  #pathCount: number = 1;

  #addPath() {
    this.#pathCount++;
  }

  get metrics(): CyclomaticComplexityMetrics {
    return {
      name: this.name,
      score: this.#pathCount,
      children: this.#visitorFactory?.additionalVisitors
        .filter(v => !!v)
        .map(v => v.metrics),
    };
  }
}
