import * as ts from 'typescript';
import { AstVisitor, VisitProps } from './AstTraverser';
import Metrics from './Metrics';
import { allPass, anyPass } from 'remeda';

function isNot<T, F extends (t: T) => boolean>(fn: F): (arg: T) => boolean {
  return (arg: T) => !fn(arg);
}

function isElseOrElseIfStatement(node: ts.Node): boolean {
  if (
    (ts.isIfStatement(node) || ts.isBlock(node)) &&
    node.parent &&
    ts.isIfStatement(node.parent)
  ) {
    // console.log(
    //   node.getText(node.getSourceFile()),
    //   'node.parent.elseStatement: ',
    //   node.parent.elseStatement === node,
    //   node.parent.elseStatement?.getText(node.parent.getSourceFile()) ??
    //     'no elseStatement',
    // );
    return node.parent.elseStatement === node;
  }
  return false;
}

function hasLabel(node: ts.Node): boolean {
  return !!node['label'];
}

/** nest level に影響を受けたインクリメントを行う node の判定 */
const incrementScoreMachers: ((node: ts.Node) => boolean)[] = [
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
const simpleIncrementScoreMachers: ((node: ts.Node) => boolean)[] = [
  allPass([anyPass([ts.isIfStatement, ts.isBlock]), isElseOrElseIfStatement]),
  allPass([ts.isBreakOrContinueStatement, hasLabel]),
];

const incrementNestMachers: ((node: ts.Node) => boolean)[] = [
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
];

export default class CognitiveComplexity
  implements AstVisitor, Metrics<number>
{
  visit({ node }: VisitProps) {
    this.#trackLogicalToken(node);
    if (incrementScoreMachers.some(matcher => matcher(node))) {
      this.#incrementScore();
      // console.log(
      //   'increment: ',
      //   getText(node, node.getSourceFile()),
      //   this.#nestLevel,
      // );
    }
    if (simpleIncrementScoreMachers.some(matcher => matcher(node))) {
      this.#simpleIncrementScore();
      // console.log('simple increment: ', getText(node, node.getSourceFile()), 1);
    }
    if (incrementNestMachers.some(matcher => matcher(node))) {
      this.#enterNest();
      // console.log(
      //   'enter: ',
      //   getText(node, node.getSourceFile()),
      //   this.#nestLevel,
      // );
      return () => {
        // console.log(
        //   'exit: ',
        //   getText(node, node.getSourceFile()),
        //   this.#nestLevel,
        // );
        this.#exitNest();
      };
    }
  }

  #score: number = 0;
  #incrementScore() {
    this.#score += this.#nestLevel;
  }
  #simpleIncrementScore() {
    this.#score++;
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
    // デバッグ用ログ 残す
    // if (ts.isIfStatement(node)) {
    //   function hoge(node: ts.Node) {
    //     const n = node['expression'] ?? node;
    //     console.group(n.getText(n.getSourceFile()).replaceAll(/\r?\n/g, ' '));
    //     n.forEachChild(hoge);
    //     console.groupEnd();
    //   }
    //   hoge(node);
    // }
    if (
      node.kind === ts.SyntaxKind.AmpersandAmpersandToken ||
      node.kind === ts.SyntaxKind.BarBarToken
    ) {
      let parentFlg = false;
      node.parent.parent.forEachChild(n => {
        if (n === node.parent) {
          parentFlg = true;
          return;
        }
        if (parentFlg) {
          parentFlg = false;
          // console.log('parent next: ', getText(n, n.getSourceFile()));
          // 親の兄弟ノードが自分の SyntaxKind と異なる場合、自分がその論理演算子の最後のノードであると判断し、スコアのインクリメントを行う
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

  get metrics() {
    return this.#score;
  }
}
