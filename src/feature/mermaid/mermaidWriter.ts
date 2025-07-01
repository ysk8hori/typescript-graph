import type { Graph, Node, Relation } from '../graph/models';
import type { OptionValues } from '../../setting/model';
import type { DirAndNodesTree } from './directoryTreeBuilder';
import { fileNameToMermaidId, fileNameToMermaidName } from './mermaidUtils';

type Options = Omit<OptionValues, 'watchMetrics'> & {
  rootDir: string;
};

const indent = '    ';
const CLASSNAME_DIR = 'dir';
const CLASSNAME_HIGHLIGHT = 'highlight';
const CLASSNAME_CREATED = 'created';
const CLASSNAME_MODIFIED = 'modified';
const CLASSNAME_DELETED = 'deleted';

export function writeFlowchartDirection(
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

export function writeClassDefinitions(
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

export function writeRelations(write: (arg: string) => void, graph: Graph) {
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

export function writeFileNodesWithSubgraph(
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