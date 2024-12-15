import * as ts from 'typescript';

interface OperatorAndOperandMetrics {
  /** 演算子の総数 */
  operatorsTotal: number;
  /** ユニークな演算子の数 */
  operatorsUnique: number;
  /** オペランドの総数 */
  operandsTotal: number;
  /** ユニークなオペランドの数 */
  operandsUnique: number;
}

export function analyzeOperatorsAndOperands(
  sourceCode: string,
): OperatorAndOperandMetrics {
  const sourceFile = ts.createSourceFile(
    'sample.ts',
    sourceCode,
    ts.ScriptTarget.Latest,
    true,
  );

  const operatorKinds = new Set<ts.SyntaxKind>();
  const operandKinds = new Set<string>();
  let totalOperators = 0;
  let totalOperands = 0;

  const visit = (node: ts.Node) => {
    try {
      console.log(node.getText(sourceFile), node);
    } catch (e) {}
    if (isOperator(node.kind)) {
      totalOperators++;
      operatorKinds.add(node.kind);

      if (ts.isIfStatement(node) && node.elseStatement) {
        // else をカウントする
        totalOperators++;
        operatorKinds.add(ts.SyntaxKind.ElseKeyword);
      }
    }

    if (isOperand(node.kind)) {
      totalOperands++;
      operandKinds.add(node.getText(sourceFile));
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);

  // console.log(
  //   'operatorKinds:',
  //   Array.from(operatorKinds).map(kind => ts.SyntaxKind[kind]),
  // );
  // console.log('operandKinds:', operandKinds);
  return {
    operatorsTotal: totalOperators,
    operatorsUnique: operatorKinds.size,
    operandsTotal: totalOperands,
    operandsUnique: operandKinds.size,
  };
}
/**
 * FIXME: `const x = 10;` のような式に対して、 EqualToken を
 */
const isOperator = (kind: ts.SyntaxKind): boolean => {
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
};

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
