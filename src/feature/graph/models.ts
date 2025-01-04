type FileName = string;
type DirName = string;
type FilePath = string;
export type ChangeStatus = 'not_modified' | 'created' | 'modified' | 'deleted';
export type Node = {
  path: FilePath;
  name: FileName | DirName;
  isDirectory?: boolean;
  highlight?: boolean;
  changeStatus: ChangeStatus;
};
export type NodeWithInstability = Node & {
  afferentCoupling: number;
  efferentCoupling: number;
  instability: number;
};

export function measureInstability(graph: Graph): NodeWithInstability[] {
  console.time('coupling');
  const couplingData = graph.nodes
    .filter(node => !node.isDirectory)
    .filter(
      node => !/node_modules|\.{test|spec|stories}\.|.json$/.test(node.path),
    )
    .map(node => {
      // このノードに依存しているノードの数
      const afferentCoupling = graph.relations.filter(
        r => r.kind === 'depends_on' && r.to.path === node.path,
      ).length;
      // このノードが依存しているノードの数
      const efferentCoupling = graph.relations.filter(
        r => r.kind === 'depends_on' && r.from.path === node.path,
      ).length;
      return { ...node, afferentCoupling, efferentCoupling };
    })
    .map(node => {
      const totalCoupling = node.afferentCoupling + node.efferentCoupling;
      const instability =
        totalCoupling === 0 ? 0 : node.efferentCoupling / totalCoupling;
      return { ...node, instability };
    })
    .toSorted((a, b) => {
      return b.efferentCoupling - a.efferentCoupling;
    })

    .toSorted((a, b) => {
      const totalCouplingA = a.afferentCoupling + a.efferentCoupling;
      const totalCouplingB = b.afferentCoupling + b.efferentCoupling;
      return totalCouplingB - totalCouplingA;
    })
    .toSorted((a, b) => {
      return b.instability - a.instability;
    });
  console.timeEnd('coupling');
  return couplingData;
}

export type RelationType = 'depends_on' | 'rename_to';
export type RelationOfDependsOn = {
  kind: 'depends_on';
  from: Node;
  to: Node;
  fullText: string;
  changeStatus: ChangeStatus;
};
export type RelationOfRenameTo = {
  kind: 'rename_to';
  from: Node;
  to: Node;
};
export type Relation = RelationOfDependsOn | RelationOfRenameTo;
export type Graph = { nodes: Node[]; relations: Relation[] };
export type Meta = { rootDir: string };

export function isSameNode(a: Node, b: Node): boolean {
  return a.path === b.path;
}
export function isSameRelation(a: Relation, b: Relation): boolean {
  return (
    a.kind === b.kind && isSameNode(a.from, b.from) && isSameNode(a.to, b.to)
  );
}
/** 受け取った relation の重複をなくす */
export function getUniqueRelations(relations: Relation[]): Relation[] {
  return relations.reduce((prev, current) => {
    if (prev.some(rel => isSameRelation(rel, current))) return prev;
    prev.push(current);
    return prev;
  }, new Array<Relation>());
}

/** 受け取った node の重複をなくす */
export function getUniqueNodes(nodes: Node[]): Node[] {
  return nodes.reduce((prev, current) => {
    if (prev.some(rel => isSameNode(rel, current))) return prev;
    prev.push(current);
    return prev;
  }, new Array<Node>());
}
