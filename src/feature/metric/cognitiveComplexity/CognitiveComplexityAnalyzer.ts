import * as ts from 'typescript';
import { Leave } from '../AstVisitor';
import { allPass, anyPass } from 'remeda';
import {
  isTopLevelArrowFunction,
  isTopLevelClass,
  isTopLevelFunction,
  isTopLevelIIFE,
  isTopLevelObjectLiteralExpression,
  TopLevelMatcher,
} from '../astUtils';
import HierarchicalMetricsAnalyzer, {
  AnalyzeProps,
} from '../HierarchicalMetricsAnalyzer';
import { Score } from './CognitiveComplexityMetrics';

type NodeMatcher = (node: ts.Node) => boolean;

function isNot<T, F extends (t: T) => boolean>(fn: F): (arg: T) => boolean {
  return (arg: T) => !fn(arg);
}

function isElseOrElseIfStatement(node: ts.Node): boolean {
  if (
    (ts.isIfStatement(node) || ts.isBlock(node)) &&
    node.parent &&
    ts.isIfStatement(node.parent)
  ) {
    return node.parent.elseStatement === node;
  }
  return false;
}

function hasLabel(node: ts.Node): boolean {
  return !!(node as any)['label'];
}

/** nest level に影響を受けたインクリメントを行う node の判定 */
const incrementScoreMachers: NodeMatcher[] = [
  ts.isConditionalExpression,
  allPass([ts.isIfStatement, isNot(isElseOrElseIfStatement)]),
  ts.isSwitchStatement,
  ts.isForStatement,
  ts.isForInStatement,
  ts.isForOfStatement,
  ts.isWhileStatement,
  ts.isDoStatement,
  ts.isCatchClause,
  ts.isConditionalTypeNode,
  ts.isCatchClause,
];

/** nest level に影響を受けないインクリメントを行う node の判定 */
const simpleIncrementScoreMachers: NodeMatcher[] = [
  allPass([anyPass([ts.isIfStatement, ts.isBlock]), isElseOrElseIfStatement]),
  allPass([ts.isBreakOrContinueStatement, hasLabel]),
];

const incrementNestMachers: NodeMatcher[] = [
  ts.isIfStatement,
  ts.isConditionalExpression,
  ts.isSwitchStatement,
  ts.isForStatement,
  ts.isForInStatement,
  ts.isForOfStatement,
  ts.isWhileStatement,
  ts.isDoStatement,
  ts.isCatchClause,
  ts.isConditionalTypeNode,
  ts.isFunctionDeclaration,
  ts.isArrowFunction,
  ts.isFunctionExpression,
  ts.isClassDeclaration,
  ts.isObjectLiteralExpression,
];

const skipNestIncrementAtTopLevelMatchers: TopLevelMatcher[] = [
  isTopLevelFunction,
  isTopLevelArrowFunction,
  isTopLevelIIFE,
  isTopLevelClass,
  isTopLevelObjectLiteralExpression,
  (_topLevelDepth, _currentDepth, node) =>
    // オブジェクトに定義されたアローファンクションはネストレベルをインクリメントしない
    // 0:SourceFile>1:FirstStatement>2:VariableDeclarationList>3:VariableDeclaration>4:ObjectLiteralExpression>5:PropertyAssignment>6:ArrowFunction
    ts.isArrowFunction(node) &&
    ts.isObjectLiteralExpression(node.parent.parent),
  (_topLevelDepth, _currentDepth, node) =>
    // オブジェクトに定義された関数定義はネストレベルをインクリメントしない
    // 0:SourceFile>1:FirstStatement>2:VariableDeclarationList>3:VariableDeclaration>4:ObjectLiteralExpression>5:PropertyAssignment>6:FunctionExpression
    ts.isFunctionExpression(node) &&
    ts.isObjectLiteralExpression(node.parent.parent),
];

export default abstract class CognitiveComplexityAnalyzer extends HierarchicalMetricsAnalyzer<Score> {
  protected analyze({ node, depth }: AnalyzeProps): Leave | void {
    this.#trackLogicalToken(node);
    if (incrementScoreMachers.some(matcher => matcher(node))) {
      this.#incrementScore();
      // console.log(  'increment: ',  node.getText(node.getSourceFile()),  this.#nestLevel,);
    }
    if (simpleIncrementScoreMachers.some(matcher => matcher(node))) {
      this.#simpleIncrementScore();
      // console.log('simple increment: ', node.getText(node.getSourceFile()), 1);
    }
    if (
      !skipNestIncrementAtTopLevelMatchers.some(matcher =>
        matcher(this.topLevelDepth, depth, node),
      ) &&
      incrementNestMachers.some(matcher => matcher(node))
    ) {
      this.#enterNest();
      // console.log('enter: ',getText(node, node.getSourceFile()),this.#nestLevel,);
      return () => {
        // console.log('exit: ',getText(node, node.getSourceFile()),this.#nestLevel,);
        this.#exitNest();
      };
    }
  }

  protected score: Score = 0;
  #incrementScore() {
    this.score += this.#nestLevel;
  }
  #simpleIncrementScore() {
    this.score++;
  }

  #nestLevel: number = 1;
  #enterNest() {
    this.#nestLevel++;
  }
  #exitNest() {
    this.#nestLevel--;
  }

  /**
   * AmpersandAmpersandToken が出現したらそれを保持し、
   * Identifier の出現の場合はそれを保持し続け、
   * それ以外の SyntaxKind を持つ node が出現したらそれをクリアする。
   * 論理和においても同様です。
   */
  #trackLogicalToken(node: ts.Node) {
    if (
      node.kind !== ts.SyntaxKind.AmpersandAmpersandToken &&
      node.kind !== ts.SyntaxKind.BarBarToken
    ) {
      return;
    }
    let parentFlg = false;
    // 親の兄弟ノードが自分の SyntaxKind と異なる場合、自分がその論理演算子の最後のノードであると判断し、スコアのインクリメントを行う
    node.parent.parent.forEachChild(n => {
      if (n === node.parent) {
        parentFlg = true;
        return;
      }
      if (parentFlg) {
        parentFlg = false;
        // console.log('parent next: ', getText(n, n.getSourceFile()));
        if (n.kind !== node.kind) {
          this.#simpleIncrementScore();
        }
      }
    });
    if (parentFlg) {
      // 親の兄弟がいなかった場合は自分がその論理演算子の最後のノードであると判断し、スコアのインクリメントを行う
      this.#simpleIncrementScore();
    }
  }
}
