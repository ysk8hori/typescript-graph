import ts from 'typescript';

export type TopLevelMatcher = (args: {
  topLevelDepth: number;
  currentDepth: number;
  node: ts.Node;
}) => boolean;

/** トップレベルに定義された関数かどうかを判定する */
export const isTopLevelFunction: TopLevelMatcher = ({
  topLevelDepth,
  currentDepth,
  node,
}) =>
  // 0:SourceFile>1:FunctionDeclaration
  currentDepth === topLevelDepth && ts.isFunctionDeclaration(node);
