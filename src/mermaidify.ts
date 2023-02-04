import { createWriteStream, WriteStream } from 'fs';
import path from 'path';
import { Graph, Node, Relation } from './models';

type DirAndNodesTree = {
  currentDir: string;
  nodes: Node[];
  children: DirAndNodesTree[];
};
type Options = { link?: boolean; rootDir: string };

const indent = '    ';

export default async function mermaidify(
  markdownTitle: string,
  graph: Graph,
  options: Options,
) {
  const dirAndNodesTree = createDirAndNodesTree(graph);
  await writeMarkdown(markdownTitle, dirAndNodesTree, graph.relations, options);
}

/**
 * ディレクトリツリーの形を再現する。
 */
function createDirAndNodesTree(graph: Graph) {
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

  const allDir = graph.nodes
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
    nodes: graph.nodes.filter(
      node => getDirectoryPath(node.path) === currentDir,
    ),
  }));

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
  return dirAndNodesTree;
}

async function writeMarkdown(
  title: string,
  dirAndNodesTree: DirAndNodesTree[],
  relations: Relation[],
  options: Options,
) {
  return new Promise((resolve, reject) => {
    const ws = createWriteStream(`./${title}.md`);
    ws.on('finish', resolve);
    ws.on('error', reject);
    ws.write('# typescript graph on mermaid\n');
    ws.write('\n');
    ws.write('```mermaid\n');
    ws.write('flowchart LR');
    ws.write('\n');

    writeFileNodesWithSubgraph(ws, dirAndNodesTree);

    writeRelations(ws, relations);

    if (options.link) {
      writeFileLink(ws, dirAndNodesTree, options.rootDir);
    }

    ws.end('```\n');
  });
}

function writeRelations(ws: WriteStream, relations: Relation[]) {
  relations
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
    .forEach(relation => {
      ws.write(`    ${relation.from.mermaidId}-->${relation.to.mermaidId}`);
      ws.write('\n');
    });
}

function fileNameToMermaidId(fileName: string): string {
  return fileName.split(/@|\[|\]/).join('__');
}

function writeFileNodesWithSubgraph(ws: WriteStream, trees: DirAndNodesTree[]) {
  trees.forEach(tree => addGraph(ws, tree));
}

function addGraph(
  ws: WriteStream,
  tree: DirAndNodesTree,
  indentNumber = 0,
  parent?: string,
) {
  let _indent = indent;
  for (let i = 0; i < indentNumber; i++) {
    _indent = _indent + indent;
  }
  ws.write(
    `${_indent}subgraph ${fileNameToMermaidId(tree.currentDir)}["${
      parent ? tree.currentDir.replace(parent, '') : tree.currentDir
    }"]`,
  );
  ws.write('\n');
  tree.nodes
    .map(node => ({ ...node, mermaidId: fileNameToMermaidId(node.path) }))
    .forEach(node => {
      ws.write(`${_indent}${indent}${node.mermaidId}["${node.fileName}"]`);
      ws.write('\n');
    });
  tree.children.forEach(child =>
    addGraph(ws, child, indentNumber + 1, tree.currentDir),
  );
  ws.write(`${_indent}end`);
  ws.write('\n');
}
function writeFileLink(
  ws: WriteStream,
  trees: DirAndNodesTree[],
  rootDir: string,
) {
  trees.forEach(tree => addLink(ws, tree, rootDir));
}

function addLink(
  ws: WriteStream,
  tree: DirAndNodesTree,
  rootDir: string,
): void {
  tree.nodes
    .map(node => ({ ...node, mermaidId: fileNameToMermaidId(node.path) }))
    .forEach(node => {
      ws.write(
        `${indent}click ${node.mermaidId} href "vscode://file/${path.join(
          rootDir,
          node.path,
        )}" _blank`,
      );
      ws.write('\n');
    });
  tree.children.forEach(child => addLink(ws, child, rootDir));
}
