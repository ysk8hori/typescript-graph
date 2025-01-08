export type Tree<T> = T & { children?: Tree<T>[] };
export type UnTree<T> = T extends Tree<infer U> ? U : never;

export function unTree<T>(t: Tree<T> | Tree<T>[]): T[] {
  return Array.isArray(t)
    ? t.map(m => unTree(m)).flat()
    : [t, ...(t.children?.flatMap(unTree) ?? [])];
}
