import * as ts from 'typescript';
import { AstVisitor, VisitProps } from './AstTraverser';
import Metrics from './Metrics';
import { allPass } from 'remeda';

function kindMatcher(kind: ts.SyntaxKind) {
  return (node: ts.Node) => node.kind === kind;
}

const cyclomaticNodeMatchers: ((node: ts.Node) => boolean)[] = [
  ts.isConditionalExpression,
  allPass([ts.isPropertyAccessExpression, ts.isOptionalChain]),
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

export default class CyclomaticComplexity
  implements AstVisitor, Metrics<number>
{
  /** デバッグ用 */
  #getText(node: ts.Node, sourceFile: ts.SourceFile) {
    return node.getText(sourceFile).replaceAll(/\r?\n/g, ' ');
  }

  visit({ node }: VisitProps) {
    if (cyclomaticNodeMatchers.some(matcher => matcher(node))) this.#addPath();
  }

  #pathCount: number = 1;

  #addPath() {
    this.#pathCount++;
  }

  get metrics() {
    return this.#pathCount;
  }
}
