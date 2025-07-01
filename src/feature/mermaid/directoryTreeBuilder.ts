import path from 'path';
import type { Node } from '../graph/models';

/** ディレクトリツリーを表現するオブジェクト */
export interface DirAndNodesTree {
  currentDir: string;
  nodes: Node[];
  children: DirAndNodesTree[];
}

interface DirAndNodes {
  currentDir: string;
  dirHierarchy: string[];
  nodes: Node[];
}

/**
 * Graph からディレクトリツリーを再現した DirAndNodesTree の配列を生成する
 */
export function createDirAndNodesTree(nodes: Node[]): DirAndNodesTree[] {
  const uniqueDirectories = getUniqueDirectories(nodes);
  const dirAndNodes = createDirAndNodesMapping(uniqueDirectories, nodes);

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
