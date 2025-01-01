import * as ts from 'typescript';
import HierarchicalMetricsAnalyzer, {
  AnalyzeProps,
  HierarchicalMetris,
} from './HierarchicalMetricsAnalyzer';

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

type Score = number;

export type CyclomaticComplexityMetrics = HierarchicalMetris<Score>;

export default abstract class CyclomaticComplexity extends HierarchicalMetricsAnalyzer<Score> {
  protected analyze({ node }: AnalyzeProps) {
    if (cyclomaticNodeMatchers.some(matcher => matcher(node))) this.#addScore();
  }

  protected score: Score = 1;
  #addScore() {
    this.score++;
  }
}
