import ts from 'typescript';
import AstVisitor from './AstVisitor';

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

  const visitor = new AstVisitor({
    visit: ({ node, depth }) => {
      log(no++, depth, node, sourceFile);
    },
  });
  visitor.traverse(sourceFile);
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
