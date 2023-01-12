type FileName = string;
export type Node = { fileName: FileName };
export type Relation = { from: Node; to: Node };

export function isSameNode(a: Node, b: Node): boolean {
  return a.fileName === b.fileName;
}
export function isSameRelation(a: Relation, b: Relation): boolean {
  return isSameNode(a.from, b.from) && isSameNode(a.to, b.to);
}
