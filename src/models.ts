export type OptionValues = {
  md: string;
  mermaidLink: boolean;
  dir: string;
  include: string[];
  exclude: string[];
  abstraction: string[];
  highlight: string[];
  neo4j: boolean;
  clearDb: boolean;
  LR: boolean;
  TB: boolean;
};

type FileName = string;
type DirName = string;
type FilePath = string;
export type Node = {
  path: FilePath;
  name: FileName | DirName;
  isDirectory?: boolean;
  highlight?: boolean;
};
export type RelationType = 'depends_on' | 'rename_to';
export type RelationOfDependsOn = {
  kind: 'depends_on';
  from: Node;
  to: Node;
  fullText: string;
};
export type RelationOfRenameTo = { kind: 'rename_to'; from: Node; to: Node };
export type Relation = RelationOfDependsOn | RelationOfRenameTo;
export type Graph = { nodes: Node[]; relations: Relation[] };
export type Meta = { rootDir: string };

export function isSameNode(a: Node, b: Node): boolean {
  return a.path === b.path;
}
export function isSameRelation(a: Relation, b: Relation): boolean {
  return isSameNode(a.from, b.from) && isSameNode(a.to, b.to);
}
/** 受け取った relation の重複をなくす */
export function getUniqueRelations(relations: Relation[]): Relation[] {
  return relations.reduce((prev, current) => {
    if (prev.some(rel => isSameRelation(rel, current))) return prev;
    prev.push(current);
    return prev;
  }, new Array<Relation>());
}
