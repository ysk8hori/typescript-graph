import path from 'path';
import { Graph, Node, OptionValues } from './models';
import { getConfig } from './config';

/** ディレクトリツリーを表現するオブジェクト */
type DirAndNodesTree = {
  currentDir: string;
  nodes: Node[];
  children: DirAndNodesTree[];
};
type Options = Partial<OptionValues> & {
  rootDir: string;
};
// 🐥
const indent = '    ';
const CLASSNAME_DIR = 'dir';
const CLASSNAME_HIGHLIGHT = 'highlight';
const CLASSNAME_CREATED = 'created';
const CLASSNAME_MODIFIED = 'modified';
const CLASSNAME_DELETED = 'deleted';

export default async function mermaidify(
  write: (arg: string) => void,
  graph: Graph,
  options: Options,
) {
  // フローチャートの方向を指定
  if (options.LR) {
    write(`flowchart LR\n`);
  } else if (options.TB) {
    write(`flowchart TB\n`);
  } else {
    write(`flowchart\n`);
  }

  // 抽象化フラグが立っている場合は、クラス定義を追加
  if (options.abstraction)
    write(`${indent}classDef ${CLASSNAME_DIR} fill:#0000,stroke:#999\n`);

  // ハイライトフラグが立っている場合は、クラス定義を追加
  if (options.highlight)
    write(`${indent}classDef ${CLASSNAME_HIGHLIGHT} fill:yellow,color:black\n`);

  // created のノードがある場合は、クラス定義を追加
  if (graph.nodes.some(node => node.changeStatus === 'created'))
    write(
      `${indent}classDef ${CLASSNAME_CREATED} fill:cyan,stroke:#999,color:black\n`,
    );

  // modified のノードがある場合は、クラス定義を追加
  if (graph.nodes.some(node => node.changeStatus === 'modified'))
    write(
      `${indent}classDef ${CLASSNAME_MODIFIED} fill:yellow,stroke:#999,color:black\n`,
    );

  // deleted のノードがある場合は、クラス定義を追加
  if (graph.nodes.some(node => node.changeStatus === 'deleted'))
    write(
      `${indent}classDef ${CLASSNAME_DELETED} fill:dimgray,stroke:#999,color:black,stroke-dasharray: 4 4,stroke-width:2px;\n`,
    );

  const dirAndNodesTree = createDirAndNodesTree(graph);
  writeFileNodesWithSubgraph(write, dirAndNodesTree);
  writeRelations(write, graph);

  if (options.mermaidLink) {
    writeFileLink(write, dirAndNodesTree, options.rootDir);
  }
}

/**
 * Graph からディレクトリツリーを再現した DirAndNodesTree の配列を生成する
 */
function createDirAndNodesTree(graph: Graph): DirAndNodesTree[] {
  function getDirectoryPath(filePath: string) {
    const array = filePath.split('/');
    if (array.includes('node_modules')) {
      // node_modules より深いディレクトリ階層の情報は捨てる
      // node_modules 内の node の name はパッケージ名のようなものになっているのでそれで良い
      return 'node_modules';
    } else if (array.length === 1) {
      // トップレベルのファイルの場合
      return undefined;
    } else {
      // 末尾のファイル名は不要
      return path.join(...array.slice(0, array.length - 1));
    }
  }

  const allDir = graph.nodes
    .map(({ path }) => getDirectoryPath(path))
    .map(dirPath => {
      if (!dirPath) return undefined;
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
      if (!current) return pre;
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

function writeRelations(write: (arg: string) => void, graph: Graph) {
  graph.relations
    .map(relation => ({
      ...relation,
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
      if (relation.kind === 'rename_to') {
        write(
          `    ${relation.from.mermaidId}-.->|"rename to"|${relation.to.mermaidId}`,
        );
      } else if (relation.changeStatus === 'deleted') {
        write(`    ${relation.from.mermaidId}-.->${relation.to.mermaidId}`);
      } else {
        write(`    ${relation.from.mermaidId}-->${relation.to.mermaidId}`);
      }
      write('\n');
    });
}

export function fileNameToMermaidId(fileName: string): string {
  return getConfig().reservedMermaidKeywords.reduce(
    (prev, [from, to]) => prev.replaceAll(from, to),
    fileName.split(/@|\[|\]|-|>|<|{|}|\(|\)|=|&|\|~|,|"|%|\^|\*|_/).join('//'),
  );
}

function fileNameToMermaidName(fileName: string): string {
  return fileName.split(/"/).join('//');
}

function writeFileNodesWithSubgraph(
  write: (arg: string) => void,
  trees: DirAndNodesTree[],
) {
  trees.forEach(tree => addGraph(write, tree));
}

function addGraph(
  write: (arg: string) => void,
  tree: DirAndNodesTree,
  indentNumber = 0,
  parent?: string,
) {
  let _indent = indent;
  for (let i = 0; i < indentNumber; i++) {
    _indent = _indent + indent;
  }
  write(
    `${_indent}subgraph ${fileNameToMermaidId(
      tree.currentDir,
    )}["${fileNameToMermaidName(
      parent ? tree.currentDir.replace(parent, '') : tree.currentDir,
    )}"]`,
  );
  write('\n');
  tree.nodes
    .map(node => ({ ...node, mermaidId: fileNameToMermaidId(node.path) }))
    .forEach(node => {
      const classString = (function () {
        if (node.highlight) {
          return `:::${CLASSNAME_HIGHLIGHT}`;
        } else if (node.isDirectory) {
          return `:::${CLASSNAME_DIR}`;
        }
        switch (node.changeStatus) {
          case 'created':
            return `:::${CLASSNAME_CREATED}`;
          case 'modified':
            return `:::${CLASSNAME_MODIFIED}`;
          case 'deleted':
            return `:::${CLASSNAME_DELETED}`;
          default:
            return '';
        }
      })();
      write(
        `${_indent}${indent}${node.mermaidId}["${fileNameToMermaidName(
          node.name,
        )}"]${classString}`,
      );
      write('\n');
    });
  tree.children.forEach(child =>
    addGraph(write, child, indentNumber + 1, tree.currentDir),
  );
  write(`${_indent}end`);
  write('\n');
}
function writeFileLink(
  write: (arg: string) => void,
  trees: DirAndNodesTree[],
  rootDir: string,
) {
  trees.forEach(tree => addLink(write, tree, rootDir));
}

function addLink(
  write: (arg: string) => void,
  tree: DirAndNodesTree,
  rootDir: string,
): void {
  tree.nodes
    .map(node => ({ ...node, mermaidId: fileNameToMermaidId(node.path) }))
    .forEach(node => {
      write(
        `${indent}click ${node.mermaidId} href "vscode://file/${path.join(
          rootDir,
          node.path,
        )}" _blank`,
      );
      write('\n');
    });
  tree.children.forEach(child => addLink(write, child, rootDir));
}
