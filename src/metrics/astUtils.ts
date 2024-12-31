import ts from 'typescript';

type TopLevelMatcherArgs = {
  topLevelDepth: number;
  currentDepth: number;
  node: ts.Node;
};

export type TopLevelMatcher = (
  topLevelDepth: number,
  currentDepth: number,
  node: ts.Node,
) => boolean;

/** トップレベルに定義された関数かどうかを判定する */
export function isTopLevelFunction(
  topLevelDepth: number,
  currentDepth: number,
  node: ts.Node,
): node is ts.FunctionDeclaration {
  // 0:SourceFile>1:FunctionDeclaration
  return currentDepth === topLevelDepth && ts.isFunctionDeclaration(node);
}

/** トップレベルに定義されたアロー関数かどうかを判定する */
export function isTopLevelArrowFunction(
  topLevelDepth: number,
  currentDepth: number,
  node: ts.Node,
): node is ts.ArrowFunction {
  // 0:SourceFile>1:FirstStatement>2:VariableDeclarationList>3:VariableDeclaration>4:ArrowFunction
  return currentDepth - 3 === topLevelDepth && ts.isArrowFunction(node);
}

/** トップレベルに定義されたIIFE(即時実行関数式)かどうかを判定する */
export function isTopLevelIIFE(
  topLevelDepth: number,
  currentDepth: number,
  node: ts.Node,
): node is ts.FunctionDeclaration {
  // 0:SourceFile>1:ExpressionStatement>2:CallExpression>3:ParenthesizedExpression>4:FunctionExpression
  return (
    currentDepth - 3 === topLevelDepth &&
    ts.isFunctionExpression(node) &&
    ts.isParenthesizedExpression(node.parent)
  );
}

const ANONYMOUS_FUNCTION_NAME = 'anonymous function';

export function getFunctionName(node: ts.FunctionDeclaration): string {
  return (
    node
      .getChildren()
      .find(n => ts.isIdentifier(n))
      ?.getText(node.getSourceFile()) ?? ANONYMOUS_FUNCTION_NAME
  );
}

export function getArrowFunctionName(node: ts.ArrowFunction): string {
  return (
    node.parent
      .getChildren()
      .find(n => ts.isIdentifier(n))
      ?.getText(node.getSourceFile()) ?? ANONYMOUS_FUNCTION_NAME
  );
}

export function getAnonymousFunctionName(): string {
  return ANONYMOUS_FUNCTION_NAME;
}
