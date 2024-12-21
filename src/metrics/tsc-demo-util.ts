import ts from 'typescript';

export function logAstNodes(sourceCode: string) {
  const sourceFile = ts.createSourceFile(
    'sample.ts',
    sourceCode,
    ts.ScriptTarget.ESNext,
  );
  let no = 0;
  const visit = (depth: number) => (node: ts.Node) => {
    console.log(
      [
        no++,
        depth,
        node
          .getText(sourceFile)
          .replaceAll(/\r?\n/g, ' ')
          .replaceAll('|', '\\|'),
        `${ts.SyntaxKind[node.kind]}${node['operator'] ? ` (${ts.SyntaxKind[node['operator']]})` : ''}`,
        ts.NodeFlags[node.flags],
      ].join(' | '),
    );
    ts.forEachChild(node, visit(depth + 1));
  };
  console.log('No. | depth | code | SyntaxKind | NodeFlags');
  console.log('--|--|--|--|--');
  visit(0)(sourceFile);
}
