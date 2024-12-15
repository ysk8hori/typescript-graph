import ts from 'typescript';

export function logAstNodes(sourceCode: string) {
  const sourceFile = ts.createSourceFile(
    'sample.ts',
    sourceCode,
    ts.ScriptTarget.ESNext,
  );
  const visit = (depth: number) => (node: ts.Node) => {
    console.log(
      [
        depth,
        node
          .getText(sourceFile)
          .replaceAll(/\r?\n/g, ' ')
          .replaceAll('|', '\\|'),
        ts.SyntaxKind[node.kind],
        ts.NodeFlags[node.flags],
      ].join(' | '),
    );
    ts.forEachChild(node, visit(depth + 1));
  };
  console.log('depth | code | SyntaxKind | NodeFlags');
  console.log('--|--|--|--');
  visit(0)(sourceFile);
}
