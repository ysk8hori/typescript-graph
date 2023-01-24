import { writeFileSync } from 'fs';
import path from 'path';
import { isSameNode, Node, Relation } from './models';

export default function mermaidify(graph: {
  nodes: Node[];
  relations: Relation[];
}): string[] {
  let lines = ['flowchart LR'];
  const indent = '    ';

  const allNodes = [
    ...graph.nodes,
    ...graph.relations.map(({ from, to }) => [from, to]).flat(),
  ].reduce((pre, current) => {
    // 重複除去
    if (pre.some(node => isSameNode(node, current))) return pre;
    pre.push(current);
    return pre;
  }, new Array<Node>());

  function getDirectoryPath(filePath: string) {
    const array = filePath.split('/');
    if (array.includes('node_modules')) {
      // node_modules より深いディレクトリ階層の情報は捨てる
      // node_modules 内の node の name はパッケージ名のようなものになっているのでそれで良い
      return 'node_modules';
    } else {
      // 末尾のファイル名は不要
      return path.join(...array.slice(0, array.length - 1));
    }
  }

  const allDir = allNodes
    .map(({ path }) => getDirectoryPath(path))
    .map(dirPath => {
      const dirArray = dirPath.split('/');
      return dirArray.reduce((prev, current) => {
        const prevValue = prev.at(-1);
        if (prevValue) {
          prev.push(path.join(prevValue, current));
        } else {
          prev.push(current);
        }
        return prev;
      }, new Array<string>());
    })
    .flat()
    .reduce((pre, current) => {
      // 重複除去
      if (pre.some(filePath => filePath === current)) return pre;
      pre.push(current);
      return pre;
    }, new Array<string>());

  type DirAndNodes = {
    currentDir: string;
    dirHierarchy: string[];
    nodes: Node[];
  };

  const dirAndNodes: DirAndNodes[] = allDir.map(currentDir => ({
    currentDir,
    dirHierarchy: currentDir.split('/'),
    nodes: allNodes.filter(node => getDirectoryPath(node.path) === currentDir),
  }));

  type DirAndNodesTree = {
    currentDir: string;
    nodes: Node[];
    children: DirAndNodesTree[];
  };

  function isChild(parentDirHierarchy: string[], candidate: string[]) {
    if (parentDirHierarchy.length !== candidate.length - 1) return false;
    return parentDirHierarchy.every(
      (tmpdirname, i) => tmpdirname === candidate[i],
    );
  }

  function createDirAndNodesRecursive({
    currentDir,
    nodes,
    dirHierarchy,
  }: DirAndNodes): DirAndNodesTree[] {
    if (
      nodes.length === 0 &&
      dirAndNodes.filter(item => isChild(dirHierarchy, item.dirHierarchy))
        .length <= 1
    ) {
      return dirAndNodes
        .filter(item => isChild(dirHierarchy, item.dirHierarchy))
        .map(createDirAndNodesRecursive)
        .flat();
    }
    return [
      {
        currentDir,
        nodes,
        children: dirAndNodes
          .filter(item => isChild(dirHierarchy, item.dirHierarchy))
          .map(createDirAndNodesRecursive)
          .flat(),
      },
    ];
  }

  const dirAndNodesTree = dirAndNodes
    .filter(dirAndNode => dirAndNode.dirHierarchy.length === 1)
    .map(createDirAndNodesRecursive)
    .flat();

  function addGraph(tree: DirAndNodesTree) {
    lines.push(
      `${indent}subgraph ${fileNameToMermaidId(tree.currentDir)}["${
        tree.currentDir
      }"]`,
    );
    lines = lines.concat(
      tree.nodes
        .map(node => ({ ...node, mermaidId: fileNameToMermaidId(node.path) }))
        .map(node => `${indent}${indent}${node.mermaidId}["${node.fileName}"]`),
    );
    tree.children.forEach(addGraph);
    lines.push(`${indent}end`);
  }

  dirAndNodesTree.forEach(addGraph);

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
  return fileName.split(/@|\[|\]/).join('__');
}
