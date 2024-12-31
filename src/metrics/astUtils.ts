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

export function getFunctionName(node: ts.FunctionDeclaration): string {
  return (
    node
      .getChildren()
      .find(n => ts.isIdentifier(n))
      ?.getText(node.getSourceFile()) ?? 'unknown name'
  );
}

export function getArrowFunctionName(node: ts.ArrowFunction): string {
  return (
    node.parent
      .getChildren()
      .find(n => ts.isIdentifier(n))
      ?.getText(node.getSourceFile()) ?? 'unknown name'
  );
}
