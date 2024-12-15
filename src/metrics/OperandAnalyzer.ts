import * as ts from 'typescript';

interface OperandMetrics {
  /** オペランドの総数 */
  operandsTotal: number;
  /** ユニークなオペランドの数 */
  operandsUnique: number;
}

const isOperand = (kind: ts.SyntaxKind): boolean => {
  const operandSyntaxKinds: ts.SyntaxKind[] = [
    ts.SyntaxKind.Identifier,
    ts.SyntaxKind.NumericLiteral,
    ts.SyntaxKind.StringLiteral,
    ts.SyntaxKind.TrueKeyword,
    ts.SyntaxKind.FalseKeyword,
  ];
  return operandSyntaxKinds.includes(kind);
  // return ts.isIdentifier(node) || ts.isLiteralExpression(node);
};

export default class OperandAnalyzer {
  constructor(sourceFile: ts.SourceFile) {
    this.#sourceFile = sourceFile;
  }
  readonly #sourceFile: ts.SourceFile;
  readonly #operandKinds: Set<string> = new Set();
  #totalOperands: number = 0;

  #visit(node: ts.Node = this.#sourceFile) {
    if (isOperand(node.kind)) {
      this.#totalOperands++;
      this.#operandKinds.add(node.getText(this.#sourceFile));
    }
    ts.forEachChild(node, node => this.#visit(node));
  }

  analyze(): OperandMetrics {
    this.#visit();
    return {
      operandsTotal: this.#totalOperands,
      operandsUnique: this.#operandKinds.size,
    };
  }
}
