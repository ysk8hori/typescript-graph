import * as ts from 'typescript';

interface OperatorMetrics {
  /** 演算子の総数 */
  operatorsTotal: number;
  /** ユニークな演算子の数 */
  operatorsUnique: number;
}

function isOperator(kind: ts.SyntaxKind): boolean {
  const operatorSyntaxKinds: ts.SyntaxKind[] = [
    ts.SyntaxKind.VariableDeclaration, // FIXME: 本当は `=` だけを演算子としてカウントしたいが、変数宣言の `=` は VariableDeclaration でカウントするしか手段がない
    ts.SyntaxKind.PlusToken,
    // ts.SyntaxKind.MinusToken,
    // ts.SyntaxKind.AsteriskToken,
    // ts.SyntaxKind.SlashToken,
    ts.SyntaxKind.EqualsToken,
    ts.SyntaxKind.FirstAssignment,
    ts.SyntaxKind.PlusEqualsToken,
    ts.SyntaxKind.LessThanToken,
    ts.SyntaxKind.LessThanEqualsToken,
    ts.SyntaxKind.GreaterThanToken,
    ts.SyntaxKind.GreaterThanEqualsToken,
    ts.SyntaxKind.IfStatement,
    // ts.SyntaxKind.ReturnKeyword,
    ts.SyntaxKind.ReturnStatement,
  ];
  return operatorSyntaxKinds.includes(kind);
}

export default class OperatorAnalyzer {
  constructor(sourceFile: ts.SourceFile) {
    this.#sourceFile = sourceFile;
  }
  readonly #sourceFile: ts.SourceFile;
  readonly #operatorKinds: Set<ts.SyntaxKind> = new Set();
  #totalOperators: number = 0;

  #visit(node: ts.Node = this.#sourceFile) {
    if (isOperator(node.kind)) {
      this.#totalOperators++;
      this.#operatorKinds.add(node.kind);

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
