import { writeFileSync } from 'fs';
import { Node, Relation } from './models';

export default function mermaidify(graph: {
  nodes: Node[];
  relations: Relation[];
}): string[] {
  let lines = ['flowchart LR'];
  const indent = '    ';
  lines = lines.concat(
    graph.nodes
      .map(node => ({ ...node, mermaidId: fileNameToMermaidId(node.fileName) }))
      .map(node => `${indent}${node.mermaidId}["${node.fileName}"]`),
  );
  lines = lines.concat(
    graph.relations
      .map(relation => ({
        from: {
          ...relation.from,
          mermaidId: fileNameToMermaidId(relation.from.fileName),
        },
        to: {
          ...relation.to,
          mermaidId: fileNameToMermaidId(relation.to.fileName),
        },
      }))
      .map(
        relation => `    ${relation.from.mermaidId}-->${relation.to.mermaidId}`,
      ),
  );
  return lines;
}

export function output(title: string, mermaidLines: string[]) {
  const hoge = `# typescript graph on mermaid
  
\`\`\`mermaid
${mermaidLines.join('\n')}
\`\`\`
`;
  writeFileSync(`./${title}.md`, hoge);
}

export function fileNameToMermaidId(fileName: string): string {
  return fileName.replace('@', '__');
}
