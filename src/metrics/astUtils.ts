import ts from 'typescript';

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
): node is ts.FunctionExpression {
  // 0:SourceFile>1:ExpressionStatement>2:CallExpression>3:ParenthesizedExpression>4:FunctionExpression
  return (
    currentDepth - 3 === topLevelDepth &&
    ts.isFunctionExpression(node) &&
    ts.isParenthesizedExpression(node.parent)
  );
}

/** トップレベルに定義されたクラスかどうかを判定する */
export function isTopLevelClass(
  topLevelDepth: number,
  currentDepth: number,
  node: ts.Node,
): node is ts.ClassDeclaration {
  // 0:SourceFile>1:ClassDeclaration
  return currentDepth === topLevelDepth && ts.isClassDeclaration(node);
}

/** トップレベルに定義されたオブジェクトかどうかを判定する */
export function isTopLevelObjectLiteralExpression(
  topLevelDepth: number,
  currentDepth: number,
  node: ts.Node,
): node is ts.ObjectLiteralExpression {
  // 0:SourceFile>1:FirstStatement>2:VariableDeclarationList>3:VariableDeclaration>4:ObjectLiteralExpression
  return (
    currentDepth - 3 <= topLevelDepth && ts.isObjectLiteralExpression(node)
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

export function getClassName(node: ts.ClassDeclaration): string {
  return (
    node
      .getChildren()
      .find(n => ts.isIdentifier(n))
      ?.getText(node.getSourceFile()) ?? 'anonymous class'
  );
}

export function getConstructorName(): string {
  return 'constructor';
}

export function getMethodName(node: ts.MethodDeclaration): string {
  return (
    node
      .getChildren()
      .find(n => ts.isIdentifier(n) || ts.isPrivateIdentifier(n))
      ?.getText(node.getSourceFile()) ?? 'anonymous method'
  );
}

export function getGetAccessorName(node: ts.GetAccessorDeclaration): string {
  const name =
    node
      .getChildren()
      .find(n => ts.isIdentifier(n))
      ?.getText(node.getSourceFile()) ?? 'anonymous get accessor';
  return `get ${name}`;
}

export function getSetAccessorName(node: ts.SetAccessorDeclaration): string {
  const name =
    node
      .getChildren()
      .find(n => ts.isIdentifier(n))
      ?.getText(node.getSourceFile()) ?? 'anonymous set accessor';
  return `set ${name}`;
}

export function getObjectName(node: ts.ObjectLiteralExpression): string {
  return (
    node.parent
      .getChildren()
      .find(n => ts.isIdentifier(n))
      ?.getText(node.getSourceFile()) ?? 'anonymous object'
  );
}
