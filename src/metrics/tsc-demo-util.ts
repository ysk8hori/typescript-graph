import ts from 'typescript';

export function logAstNodes(sourceCode: string) {
  const sourceFile = ts.createSourceFile(
    'sample.tsx',
    sourceCode,
    ts.ScriptTarget.ESNext,
    false,
    ts.ScriptKind.TSX,
  );
  console.log('No. | depth | code | SyntaxKind | NodeFlags');
  console.log('--|--|--|--|--');
  let no = 0;
  const visit = (depth: number) => (node: ts.Node) => {
    log(no++, depth, node, sourceFile);
    if (ts.isJsxElement(node)) {
      node.openingElement.attributes.forEachChild(visit(depth + 1));
      node.children.forEach(visit(depth + 1));
    } else if (ts.isJsxSelfClosingElement(node)) {
      node.attributes.forEachChild(visit(depth + 1));
    } else {
      ts.forEachChild(node, visit(depth + 1));
    }
  };
  visit(0)(sourceFile);
}

function log(
  no: number,
  depth: number,
  node: ts.Node,
  sourceFile: ts.SourceFile,
) {
  console.log(
    [
      no,
      depth,
      getText(node, sourceFile),
      getSyntaxKindText(node),
      ts.NodeFlags[node.flags],
    ].join(' | '),
  );
}

function getText(node: ts.Node, sourceFile: ts.SourceFile) {
  return node
    .getText(sourceFile)
    .replaceAll(/\r?\n/g, ' ')
    .replaceAll('|', '\\|');
}

function getSyntaxKindText(node: ts.Node) {
  return `${ts.SyntaxKind[node.kind]}${node['operator'] ? ` (${ts.SyntaxKind[node['operator']]})` : ''}`;
}
