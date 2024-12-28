import * as ts from 'typescript';
import { AstVisitor, VisitProps } from './AstTraverser';
import Metrics from './Metrics';

export interface SemanticSyntaxVolumeMetrics {
  /** 演算子の総数 */
  semanticSyntaxTotal: number;
  /** ユニークな演算子の数 */
  semanticSyntaxUnique: number;
  /** オペランドの総数 */
  operandsTotal: number;
  /** ユニークなオペランドの数 */
  operandsUnique: number;
}

/** `a++` や `a--` を見分けるための型 */
type PostOperator = `Post${ts.SyntaxKind}`;
/** `++a` や `--a` を見分けるための型 */
type PreOperator = `Pre${ts.SyntaxKind}`;
/** `const` や `let` を見分けるための型 */
type VariableDeclarationAndFlags = `${ts.SyntaxKind}/${ts.NodeFlags}`;
type SemanticSyntaxKind =
  | PostOperator
  | PreOperator
  | VariableDeclarationAndFlags;

const isOperand = (kind: ts.SyntaxKind): boolean => {
  const operandSyntaxKinds: ts.SyntaxKind[] = [
    ts.SyntaxKind.Identifier,
    ts.SyntaxKind.FirstLiteralToken,
    ts.SyntaxKind.StringLiteral,
    ts.SyntaxKind.NumericLiteral,
    ts.SyntaxKind.BigIntLiteral,
    ts.SyntaxKind.RegularExpressionLiteral,
    ts.SyntaxKind.TrueKeyword,
    ts.SyntaxKind.FalseKeyword,
    // JSX におけるオペランド
    ts.SyntaxKind.JsxText,
    // テンプレートリテラルにおけるオペランド
    ts.SyntaxKind.FirstTemplateToken,
    ts.SyntaxKind.NoSubstitutionTemplateLiteral,
    ts.SyntaxKind.TemplateHead,
    ts.SyntaxKind.TemplateMiddle,
    // ts.SyntaxKind.TemplateSpan, // 2}` などが該当するためオペランドではない
    ts.SyntaxKind.LastTemplateToken,
  ];
  return operandSyntaxKinds.includes(kind);
};

/**
 * AST の Syntax のうち、人がソースコードを読んだ際に認識する意味のあるまとまり（ノード）をカウントしたい。
 * そのため、認識するまとまりとして重複するものを除去する。
 */
function isIgnoredSyntaxKind(kind: ts.SyntaxKind): boolean {
  const ignoredSyntaxKinds: ts.SyntaxKind[] = [
    ts.SyntaxKind.SourceFile,
    ts.SyntaxKind.FirstStatement,
    ts.SyntaxKind.EndOfFileToken,
    ts.SyntaxKind.VariableDeclaration, // VariableDeclarationList と Identifier でカウントする
    ts.SyntaxKind.ExpressionStatement, // ExpressionStatement の中には XxxExpression が含まれるので無視して良い
  ];
  return ignoredSyntaxKinds.includes(kind);
}

export default class SemanticSyntaxVolume
  implements AstVisitor, Metrics<SemanticSyntaxVolumeMetrics>
{
  visit({ node, sourceFile }: VisitProps) {
    if (isIgnoredSyntaxKind(node.kind)) return;
    if (isOperand(node.kind)) {
      this.#handleOperand(node, sourceFile);
    } else {
      this.#handleSemanticSyntaxNode(node);
    }
  }

  readonly #uniqueSemanticSyntaxKinds: Set<SemanticSyntaxKind> = new Set();
  #totalSemanticSyntax: number = 0;

  readonly #uniqueOperands: Set<string> = new Set();
  #totalOperands: number = 0;

  #addSemanticSyntaxKind(kind: SemanticSyntaxKind) {
    this.#uniqueSemanticSyntaxKinds.add(kind);
    this.#totalSemanticSyntax++;
  }

  #addOperand(operand: string) {
    this.#uniqueOperands.add(operand);
    this.#totalOperands++;
  }

  #handleOperand(node: ts.Node, sourceFile: ts.SourceFile) {
    if (!isOperand(node.kind)) return;
    this.#addOperand(node.getText(sourceFile));
  }

  #handleSemanticSyntaxNode(node: ts.Node) {
    if (ts.isPostfixUnaryExpression(node)) {
      this.#addSemanticSyntaxKind(`Post${node.operator}`);
    } else if (ts.isPrefixUnaryExpression(node)) {
      this.#addSemanticSyntaxKind(`Pre${node.operator}`);
    } else if (ts.isVariableDeclarationList(node)) {
      // 変数定義をカウントしたくない場合はここをコメントアウトする
      this.#addSemanticSyntaxKind(`${node.kind}/${node.flags}`);
    } else if (ts.isDotDotDotToken(node)) {
      // DotDotDotToken と SpreadElement は同じ演算子としてカウントする
      // もし別でカウントしたい事例があれば考える
      this.#addSemanticSyntaxKind(
        `${ts.SyntaxKind.SpreadElement}/${node.flags}`,
      );
    } else if (ts.isAsteriskToken(node)) {
      // parent が FunctionDeclaration の場合は乗算ではなくジェネレータ関数なのでカウントしない
      // parent が YieldExpression の場合は乗算ではなく yield* 演算子なのでカウントしない
      // yield と yield* は同じ演算子としてカウントする
      // 後続処理があるので早期リターンしない
      if (
        !ts.isFunctionDeclaration(node.parent) &&
        !ts.isYieldExpression(node.parent)
      ) {
        this.#addSemanticSyntaxKind(`${node.kind}/${node.flags}`);
      }
    } else {
      this.#addSemanticSyntaxKind(
        node['operator'] ?? `${node.kind}/${node.flags}`,
      );
    }

    if (ts.isIfStatement(node) && node.elseStatement) {
      // else をカウントする
      this.#addSemanticSyntaxKind(`${ts.SyntaxKind.ElseKeyword}/${node.flags}`);
    }
    if (ts.isTryStatement(node) && node.finallyBlock) {
      // finally をカウントする
      this.#addSemanticSyntaxKind(
        `${ts.SyntaxKind.FinallyKeyword}/${node.flags}`,
      );
    }
  }

  // TODO: 本来 metrics として返すべきは volume なのでそのうち修正する
  get metrics(): SemanticSyntaxVolumeMetrics {
    return {
      semanticSyntaxTotal: this.#totalSemanticSyntax,
      semanticSyntaxUnique: this.#uniqueSemanticSyntaxKinds.size,
      operandsTotal: this.#totalOperands,
      operandsUnique: this.#uniqueOperands.size,
    };
  }

  get volume(): number {
    const N = this.metrics.semanticSyntaxTotal + this.metrics.operandsTotal;
    const n = this.metrics.semanticSyntaxUnique + this.metrics.operandsUnique;
    return N * Math.log2(n);
  }
}
