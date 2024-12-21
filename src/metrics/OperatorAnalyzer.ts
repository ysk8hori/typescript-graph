import * as ts from 'typescript';

interface OperatorMetrics {
  /** 演算子の総数 */
  operatorsTotal: number;
  /** ユニークな演算子の数 */
  operatorsUnique: number;
}

/** `a++` や `a--` を見分けるための Operator 定義 */
type PostOperator = `Post${ts.SyntaxKind}`;
/** `++a` や `--a` を見分けるための Operator 定義 */
type PreOperator = `Pre${ts.SyntaxKind}`;
/** `const` や `let` を見分けるための Operator 定義 */
type VariableDeclarationAndFlags = `${ts.SyntaxKind}/${ts.NodeFlags}`;

function isOperator(kind: ts.SyntaxKind): boolean {
  const operatorSyntaxKinds: ts.SyntaxKind[] = [
    ts.SyntaxKind.VariableDeclarationList,
    ts.SyntaxKind.PlusToken,
    ts.SyntaxKind.MinusToken,
    ts.SyntaxKind.AsteriskToken,
    ts.SyntaxKind.SlashToken,
    ts.SyntaxKind.EqualsToken,
    ts.SyntaxKind.PercentToken,
    ts.SyntaxKind.FirstAssignment,
    ts.SyntaxKind.QuestionDotToken,
    ts.SyntaxKind.NewExpression,
    ts.SyntaxKind.SuperKeyword,
    ts.SyntaxKind.ImportDeclaration,
    ts.SyntaxKind.ImportKeyword,
    ts.SyntaxKind.PostfixUnaryExpression,
    ts.SyntaxKind.PrefixUnaryExpression,
    ts.SyntaxKind.DeleteExpression,
    ts.SyntaxKind.VoidExpression,
    ts.SyntaxKind.TypeOfExpression,
    ts.SyntaxKind.AwaitExpression,
    ts.SyntaxKind.AsteriskAsteriskToken,
    ts.SyntaxKind.FirstBinaryOperator,
    ts.SyntaxKind.LessThanEqualsToken,
    ts.SyntaxKind.GreaterThanToken,
    ts.SyntaxKind.GreaterThanEqualsToken,
    ts.SyntaxKind.InstanceOfKeyword,
    ts.SyntaxKind.InKeyword,
    ts.SyntaxKind.EqualsEqualsToken,
    ts.SyntaxKind.ExclamationEqualsToken,
    ts.SyntaxKind.EqualsEqualsEqualsToken,
    ts.SyntaxKind.ExclamationEqualsEqualsToken,
    ts.SyntaxKind.LessThanLessThanToken,
    ts.SyntaxKind.GreaterThanGreaterThanToken,
    ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken,
    ts.SyntaxKind.AmpersandToken,
    ts.SyntaxKind.BarToken,
    ts.SyntaxKind.CaretToken,
    ts.SyntaxKind.AmpersandAmpersandToken,
    ts.SyntaxKind.BarBarToken,
    ts.SyntaxKind.QuestionQuestionToken,
    ts.SyntaxKind.QuestionToken,
    ts.SyntaxKind.AsteriskEqualsToken,
    ts.SyntaxKind.SlashEqualsToken,
    ts.SyntaxKind.PercentEqualsToken,
    ts.SyntaxKind.FirstCompoundAssignment,
    ts.SyntaxKind.MinusEqualsToken,
    ts.SyntaxKind.LessThanLessThanEqualsToken,
    ts.SyntaxKind.GreaterThanGreaterThanEqualsToken,
    ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken,
    ts.SyntaxKind.AmpersandEqualsToken,
    ts.SyntaxKind.LastBinaryOperator,
    ts.SyntaxKind.BarEqualsToken,
    ts.SyntaxKind.AsteriskAsteriskEqualsToken,
    ts.SyntaxKind.AmpersandAmpersandEqualsToken,
    ts.SyntaxKind.BarBarEqualsToken,
    ts.SyntaxKind.QuestionQuestionEqualsToken,
    ts.SyntaxKind.SpreadElement,
    ts.SyntaxKind.DotDotDotToken,
    ts.SyntaxKind.YieldExpression,
    ts.SyntaxKind.CommaToken,
    // ts.SyntaxKind.IfStatement,
    // ts.SyntaxKind.ReturnStatement,
  ];
  return operatorSyntaxKinds.includes(kind);
}

export default class OperatorAnalyzer {
  constructor(sourceFile: ts.SourceFile) {
    this.#sourceFile = sourceFile;
  }
  readonly #sourceFile: ts.SourceFile;
  readonly #operatorKinds: Set<
    ts.SyntaxKind | PostOperator | PreOperator | VariableDeclarationAndFlags
  > = new Set();
  #totalOperators: number = 0;

  #visit(node: ts.Node = this.#sourceFile) {
    if (isOperator(node.kind)) {
      if (ts.isPostfixUnaryExpression(node)) {
        this.#totalOperators++;
        this.#operatorKinds.add(`Post${node.operator}`);
      } else if (ts.isPrefixUnaryExpression(node)) {
        this.#totalOperators++;
        this.#operatorKinds.add(`Pre${node.operator}`);
      } else if (ts.isVariableDeclarationList(node)) {
        // 変数定義をカウントしたくない場合はここをコメントアウトする
        this.#totalOperators++;
        this.#operatorKinds.add(
          `${node.kind}/${node.flags}` satisfies VariableDeclarationAndFlags,
        );
      } else if (ts.isDotDotDotToken(node)) {
        // DotDotDotToken と SpreadElement は同じ演算子としてカウントする
        // もし別でカウントしたい事例があれば考える
        this.#totalOperators++;
        this.#operatorKinds.add(ts.SyntaxKind.SpreadElement);
      } else if (ts.isAsteriskToken(node)) {
        // parent が FunctionDeclaration の場合は乗算ではなくジェネレータ関数なのでカウントしない
        // parent が YieldExpression の場合は乗算ではなく yield* 演算子なのでカウントしない
        // yield と yield* は同じ演算子としてカウントする
        if (
          !(
            ts.isFunctionDeclaration(node.parent) ||
            ts.isYieldExpression(node.parent)
          )
        ) {
          console.log(node);
          this.#totalOperators++;
          this.#operatorKinds.add(ts.SyntaxKind.SpreadElement);
        }
      } else {
        this.#totalOperators++;
        this.#operatorKinds.add(node['operator'] ?? node.kind);
      }

      if (ts.isIfStatement(node) && node.elseStatement) {
        // else をカウントする
        this.#totalOperators++;
        this.#operatorKinds.add(ts.SyntaxKind.ElseKeyword);
      }
    }
    ts.forEachChild(node, node => this.#visit(node));
  }

  analyze(): OperatorMetrics {
    this.#visit();
    return {
      operatorsTotal: this.#totalOperators,
      operatorsUnique: this.#operatorKinds.size,
    };
  }
}
