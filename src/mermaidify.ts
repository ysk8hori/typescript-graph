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
      .map(node => ({ ...node, mermaidId: fileNameToMermaidId(node.path) }))
      .map(node => `${indent}${node.mermaidId}["${node.path}"]`),
  );
  lines = lines.concat(
    graph.relations
      .map(relation => ({
        from: {
          ...relation.from,
          mermaidId: fileNameToMermaidId(relation.from.path),
        },
        to: {
          ...relation.to,
          mermaidId: fileNameToMermaidId(relation.to.path),
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