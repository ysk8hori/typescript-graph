import * as ts from 'typescript';
import HierarchicalMetricsAnalyzer, {
  AnalyzeProps,
} from '../HierarchicalMetricsAnalyzer';
import { Score } from './CyclomaticComplexityMetrics';

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

export default abstract class CyclomaticComplexityAnalyzer extends HierarchicalMetricsAnalyzer<Score> {
  protected analyze({ node }: AnalyzeProps) {
    if (cyclomaticNodeMatchers.some(matcher => matcher(node))) this.#addScore();
  }

  protected score: Score = 1;
  #addScore() {
    this.score++;
  }
}
