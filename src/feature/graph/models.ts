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

export type RelationType = 'depends_on' | 'rename_to';
export type RelationOfDependsOn = {
  kind: 'depends_on';
  from: Node;
  to: Node;
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
