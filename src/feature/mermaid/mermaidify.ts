import path from 'path';
import type { Graph, Node, Relation } from '../graph/models';
import { getConfig } from '../../setting/config';
import type { OptionValues } from '../../setting/model';

/** ディレクトリツリーを表現するオブジェクト */
interface DirAndNodesTree {
  currentDir: string;
  nodes: Node[];
  children: DirAndNodesTree[];
}
type Options = Omit<OptionValues, 'watchMetrics'> & {
  rootDir: string;
};

const indent = '    ';
const CLASSNAME_DIR = 'dir';
const CLASSNAME_HIGHLIGHT = 'highlight';
const CLASSNAME_CREATED = 'created';
const CLASSNAME_MODIFIED = 'modified';
const CLASSNAME_DELETED = 'deleted';

export function writeGraph(
  write: (str: string) => void,
  graph: Graph,
  options: Options,
) {
  write('```mermaid\n');
  mermaidify(str => write(str), graph, options);
  write('```\n');
  write('\n');
}

export function mermaidify(
  write: (arg: string) => void,
  graph: Graph,
  options: Pick<Options, 'LR' | 'TB' | 'abstraction' | 'highlight'>,
) {
  writeFlowchartDirection(write, options);
  writeClassDefinitions(write, graph, options);

  const dirAndNodesTree = createDirAndNodesTree(graph);
  writeFileNodesWithSubgraph(write, dirAndNodesTree);
  writeRelations(write, graph);

  // TODO: いつか復活させる
  // if (options.mermaidLink) {
  //   writeFileLink(write, dirAndNodesTree, options.rootDir);
  // }
}

/**
 * Graph からディレクトリツリーを再現した DirAndNodesTree の配列を生成する
 */
function createDirAndNodesTree(graph: Graph): DirAndNodesTree[] {
  const uniqueDirectories = getUniqueDirectories(graph.nodes);
  const dirAndNodes = createDirAndNodesMapping(uniqueDirectories, graph.nodes);

  return buildDirectoryTree(dirAndNodes);
}

function getDirectoryPath(filePath: string): string | undefined {
  const pathSegments = filePath.split('/');

  if (pathSegments.includes('node_modules')) {
    return 'node_modules';
  }

  if (pathSegments.length === 1) {
    return undefined;
  }

  return path.join(...pathSegments.slice(0, -1));
}

function getUniqueDirectories(nodes: Node[]): string[] {
  const allDirectories = nodes
    .map(({ path }) => getDirectoryPath(path))
    .filter((dir): dir is string => dir !== undefined)
    .flatMap(dirPath => {
      const segments = dirPath.split('/');
      return segments.reduce<string[]>((acc, _segment, index) => {
        const currentPath = segments.slice(0, index + 1).join('/');
        acc.push(currentPath);
        return acc;
      }, []);
    });

  return [...new Set(allDirectories)];
}

interface DirAndNodes {
  currentDir: string;
  dirHierarchy: string[];
  nodes: Node[];
}

function createDirAndNodesMapping(
  directories: string[],
  nodes: Node[],
): DirAndNodes[] {
  return directories.map(currentDir => ({
    currentDir,
    dirHierarchy: currentDir.split('/'),
    nodes: nodes.filter(node => getDirectoryPath(node.path) === currentDir),
  }));
}

function isDirectChild(
  parentHierarchy: string[],
  candidateHierarchy: string[],
): boolean {
  return (
    parentHierarchy.length === candidateHierarchy.length - 1 &&
    parentHierarchy.every((segment, i) => segment === candidateHierarchy[i])
  );
}

function buildDirectoryTree(dirAndNodes: DirAndNodes[]): DirAndNodesTree[] {
  function buildRecursive(dirAndNode: DirAndNodes): DirAndNodesTree[] {
    const { currentDir, nodes, dirHierarchy } = dirAndNode;
    const children = dirAndNodes.filter(item =>
      isDirectChild(dirHierarchy, item.dirHierarchy),
    );

    if (nodes.length === 0 && children.length <= 1) {
      return children.flatMap(buildRecursive);
    }

    return [
      {
        currentDir,
        nodes,
        children: children.flatMap(buildRecursive),
      },
    ];
  }

  const rootDirectories = dirAndNodes.filter(
    item => item.dirHierarchy.length === 1,
  );
  return rootDirectories.flatMap(buildRecursive);
}

function writeFlowchartDirection(
  write: (arg: string) => void,
  options: Pick<Options, 'LR' | 'TB'>,
) {
  if (options.LR) {
    write(`flowchart LR\n`);
  } else if (options.TB) {
    write(`flowchart TB\n`);
  } else {
    write(`flowchart\n`);
  }
}

function writeClassDefinitions(
  write: (arg: string) => void,
  graph: Graph,
  options: Pick<Options, 'abstraction' | 'highlight'>,
) {
  if (options.abstraction) {
    write(`${indent}classDef ${CLASSNAME_DIR} fill:#0000,stroke:#999\n`);
  }

  if (options.highlight) {
    write(`${indent}classDef ${CLASSNAME_HIGHLIGHT} fill:yellow,color:black\n`);
  }

  const changeStatusClassDefs = [
    {
      status: 'created' as const,
      className: CLASSNAME_CREATED,
      style: 'fill:cyan,stroke:#999,color:black',
    },
    {
      status: 'modified' as const,
      className: CLASSNAME_MODIFIED,
      style: 'fill:yellow,stroke:#999,color:black',
    },
    {
      status: 'deleted' as const,
      className: CLASSNAME_DELETED,
      style:
        'fill:dimgray,stroke:#999,color:black,stroke-dasharray: 4 4,stroke-width:2px;',
    },
  ];

  changeStatusClassDefs.forEach(({ status, className, style }) => {
    if (graph.nodes.some(node => node.changeStatus === status)) {
      write(`${indent}classDef ${className} ${style}\n`);
    }
  });
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
      const connectionStyle = getConnectionStyle(relation);
      write(
        `    ${relation.from.mermaidId}${connectionStyle}${relation.to.mermaidId}`,
      );
      write('\n');
    });
}

function getConnectionStyle(relation: Relation): string {
  if (relation.kind === 'rename_to') {
    return `-.->|"rename to"|`;
  } else if (relation.changeStatus === 'deleted') {
    return `-.->`;
  } else {
    return `-->`;
  }
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
  const currentIndent = indent.repeat(indentNumber + 1);
  const displayName = parent
    ? tree.currentDir.replace(parent, '')
    : tree.currentDir;

  writeSubgraphStart(write, currentIndent, tree.currentDir, displayName);
  writeNodes(write, currentIndent, tree.nodes);
  writeChildGraphs(write, tree, indentNumber);
  writeSubgraphEnd(write, currentIndent);
}

function writeSubgraphStart(
  write: (arg: string) => void,
  currentIndent: string,
  currentDir: string,
  displayName: string,
) {
  write(
    `${currentIndent}subgraph ${fileNameToMermaidId(currentDir)}["${fileNameToMermaidName(displayName)}"]\n`,
  );
}

function writeNodes(
  write: (arg: string) => void,
  currentIndent: string,
  nodes: Node[],
) {
  nodes
    .map(node => ({ ...node, mermaidId: fileNameToMermaidId(node.path) }))
    .forEach(node => {
      const classString = getNodeClassString(node);
      write(
        `${currentIndent}${indent}${node.mermaidId}["${fileNameToMermaidName(node.name)}"]${classString}\n`,
      );
    });
}

function getNodeClassString(node: Node & { mermaidId: string }): string {
  if (node.highlight) {
    return `:::${CLASSNAME_HIGHLIGHT}`;
  }

  if (node.isDirectory) {
    return `:::${CLASSNAME_DIR}`;
  }

  const statusClassMap = {
    created: CLASSNAME_CREATED,
    modified: CLASSNAME_MODIFIED,
    deleted: CLASSNAME_DELETED,
    not_modified: undefined,
  } as const;

  const className = statusClassMap[node.changeStatus];
  return className ? `:::${className}` : '';
}

function writeChildGraphs(
  write: (arg: string) => void,
  tree: DirAndNodesTree,
  indentNumber: number,
) {
  tree.children.forEach(child =>
    addGraph(write, child, indentNumber + 1, tree.currentDir),
  );
}

function writeSubgraphEnd(write: (arg: string) => void, currentIndent: string) {
  write(`${currentIndent}end\n`);
}
