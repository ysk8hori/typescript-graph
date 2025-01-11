import * as ts from 'typescript';
import HierarchicalMetricsAnalyzer, {
  AnalyzeProps,
} from '../HierarchicalMetricsAnalyzer';
import { HierarchicalMetris } from '../HierarchicalMetris';

export interface SemanticSyntaxVolumeScores {
  /** 構文のボリューム */
  volume: number;
  /** 演算子の総数 */
  semanticSyntaxTotal: number;
  /** ユニークな演算子の数 */
  semanticSyntaxUnique: number;
  /** オペランドの総数 */
  operandsTotal: number;
  /** ユニークなオペランドの数 */
  operandsUnique: number;
  /** 対象の行数 */
  lines: number;
}

export type SemanticSyntaxVolumeMetrics =
  HierarchicalMetris<SemanticSyntaxVolumeScores>;

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
    ts.SyntaxKind.PrivateIdentifier,
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

export default abstract class SemanticSyntaxVolume extends HierarchicalMetricsAnalyzer<SemanticSyntaxVolumeScores> {
  protected analyze({ node, sourceFile }: AnalyzeProps) {
    this.#setLineCountFromNode(node);
    if (isIgnoredSyntaxKind(node.kind)) return;
    if (isOperand(node.kind)) {
      this.#handleOperand(node, sourceFile);
    } else {
      this.#handleSemanticSyntaxNode(node);
    }
  }

  /**
   * 解析対象とするソースコードの行数を格納する。
   * ソースコードは、ファイル全体となる場合や1つの関数となる場合など様々なので、
   * 解析開始時点で一番最初に解析対象となったノードの行数を格納する。
   */
  #lineCount: number = -1;
  #setLineCountFromNode(node: ts.Node) {
    if (this.#lineCount !== -1) return;
    this.#lineCount = node.getText(node.getSourceFile()).split('\n').length;
  }
  get lines(): number {
    return this.#lineCount;
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
        (node as any)['operator'] ?? `${node.kind}/${node.flags}`,
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

  protected get score(): SemanticSyntaxVolumeScores {
    return {
      volume: this.volume,
      semanticSyntaxTotal: this.#totalSemanticSyntax,
      semanticSyntaxUnique: this.#uniqueSemanticSyntaxKinds.size,
      operandsTotal: this.#totalOperands,
      operandsUnique: this.#uniqueOperands.size,
      lines: this.lines,
    };
  }

  get volume(): number {
    const N = this.#totalSemanticSyntax + this.#totalOperands;
    const n = this.#uniqueSemanticSyntaxKinds.size + this.#uniqueOperands.size;
    return N * Math.log2(n);
  }
}
