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
  ts.isFunctionDeclaration,
  ts.isArrowFunction,
  ts.isFunctionExpression,
  ts.isClassDeclaration,
  // 自分自身はメソッドだが親がクラスでない場合はインクリメントする（単なるオブジェクトのメソッドなど）
  node => ts.isMethodDeclaration(node) && !ts.isClassDeclaration(node.parent),
];

const skipNestIncrementAtTopLevelMatchers: ((args: {
  topLevelDepth: number;
  currentDepth: number;
  node: ts.Node;
}) => boolean)[] = [
  ({ topLevelDepth, currentDepth, node }) =>
    // 0:SourceFile>1:FunctionDeclaration
    currentDepth === topLevelDepth && ts.isFunctionDeclaration(node),
  ({ topLevelDepth, currentDepth, node }) =>
    // 0:SourceFile>1:FirstStatement>2:VariableDeclarationList>3:VariableDeclaration>4:ArrowFunction
    currentDepth - 3 === topLevelDepth && ts.isArrowFunction(node),
  ({ topLevelDepth, currentDepth, node }) =>
    // 0:SourceFile>1:ExpressionStatement>2:CallExpression>3:ParenthesizedExpression>4:FunctionExpression
    currentDepth - 3 === topLevelDepth &&
    ts.isFunctionExpression(node) &&
    ts.isParenthesizedExpression(node.parent),
  ({ topLevelDepth, currentDepth, node }) =>
    // 0:SourceFile>1:ClassDeclaration
    currentDepth === topLevelDepth && ts.isClassDeclaration(node),
];

export default class CognitiveComplexity
  implements AstVisitor, Metrics<number>
{
  constructor(options?: { topLevelDepth?: number }) {
    this.#topLevelDepth = options?.topLevelDepth ?? 1;
  }
  #topLevelDepth: number;

  visit({ node, depth }: VisitProps) {
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
        matcher({
          topLevelDepth: this.#topLevelDepth,
          currentDepth: depth,
          node,
        }),
      ) &&
      incrementNestMachers.some(matcher => matcher(node))
    ) {
      this.#enterNest();
      // console.log('enter: ',getText(node, node.getSourceFile()),this.#nestLevel,);
      return {
        leave: () => {
          // console.log('exit: ',getText(node, node.getSourceFile()),this.#nestLevel,);
          this.#exitNest();
        },
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
