import { test, expect } from 'vitest';
import { filterGraph } from './filterGraph';
import include from './filterGraph.spec.data/include.json';
import exclude from './filterGraph.spec.data/exclude.json';
import nodes from './filterGraph.spec.data/nodes.json';
import relations from './filterGraph.spec.data/relations.json';
import { Graph } from '../models';

test('filterGraph', () => {
  expect(filterGraph(include, exclude, { nodes, relations } as Graph))
    .toMatchInlineSnapshot(`
    {
      "nodes": [
        {
          "changeStatus": "not_modified",
          "name": "b.ts",
          "path": "src/includeFiles/b.ts",
        },
        {
          "changeStatus": "not_modified",
          "name": "config.ts",
          "path": "src/config.ts",
        },
        {
          "changeStatus": "not_modified",
          "name": "c.ts",
          "path": "src/includeFiles/c.ts",
        },
        {
          "changeStatus": "not_modified",
          "name": "childA.ts",
          "path": "src/includeFiles/children/childA.ts",
        },
        {
          "changeStatus": "not_modified",
          "name": "d.ts",
          "path": "src/includeFiles/d/d.ts",
        },
        {
          "changeStatus": "not_modified",
          "name": "index.ts",
          "path": "src/includeFiles/d/index.ts",
        },
        {
          "changeStatus": "not_modified",
          "name": "a.ts",
          "path": "src/includeFiles/a.ts",
        },
        {
          "changeStatus": "not_modified",
          "name": "childA.ts",
          "path": "src/includeFiles/abstractions/children/childA.ts",
        },
        {
          "changeStatus": "not_modified",
          "name": "j.ts",
          "path": "src/includeFiles/abstractions/j.ts",
        },
        {
          "changeStatus": "not_modified",
          "name": "l.ts",
          "path": "src/includeFiles/abstractions/l.ts",
        },
        {
          "changeStatus": "not_modified",
          "name": "k.ts",
          "path": "src/includeFiles/abstractions/k.ts",
        },
        {
          "changeStatus": "not_modified",
          "name": "e.ts",
          "path": "src/otherFiles/e.ts",
        },
        {
          "changeStatus": "not_modified",
          "name": "data.json",
          "path": "data.json",
        },
        {
          "changeStatus": "not_modified",
          "name": "main.ts",
          "path": "src/main.ts",
        },
      ],
      "relations": [
        {
          "changeStatus": "not_modified",
          "from": {
            "changeStatus": "not_modified",
            "name": "b.ts",
            "path": "src/includeFiles/b.ts",
          },
          "fullText": "{ config }",
          "kind": "depends_on",
          "to": {
            "changeStatus": "not_modified",
            "name": "config.ts",
            "path": "src/config.ts",
          },
        },
        {
          "changeStatus": "not_modified",
          "from": {
            "changeStatus": "not_modified",
            "name": "c.ts",
            "path": "src/includeFiles/c.ts",
          },
          "fullText": "b",
          "kind": "depends_on",
          "to": {
            "changeStatus": "not_modified",
            "name": "b.ts",
            "path": "src/includeFiles/b.ts",
          },
        },
        {
          "changeStatus": "not_modified",
          "from": {
            "changeStatus": "not_modified",
            "name": "config.ts",
            "path": "src/config.ts",
          },
          "fullText": "C",
          "kind": "depends_on",
          "to": {
            "changeStatus": "not_modified",
            "name": "c.ts",
            "path": "src/includeFiles/c.ts",
          },
        },
        {
          "changeStatus": "not_modified",
          "from": {
            "changeStatus": "not_modified",
            "name": "index.ts",
            "path": "src/includeFiles/d/index.ts",
          },
          "fullText": "* as d",
          "kind": "depends_on",
          "to": {
            "changeStatus": "not_modified",
            "name": "d.ts",
            "path": "src/includeFiles/d/d.ts",
          },
        },
        {
          "changeStatus": "not_modified",
          "from": {
            "changeStatus": "not_modified",
            "name": "a.ts",
            "path": "src/includeFiles/a.ts",
          },
          "fullText": "childA",
          "kind": "depends_on",
          "to": {
            "changeStatus": "not_modified",
            "name": "childA.ts",
            "path": "src/includeFiles/children/childA.ts",
          },
        },
        {
          "changeStatus": "not_modified",
          "from": {
            "changeStatus": "not_modified",
            "name": "a.ts",
            "path": "src/includeFiles/a.ts",
          },
          "fullText": "function",
          "kind": "depends_on",
          "to": {
            "changeStatus": "not_modified",
            "name": "index.ts",
            "path": "src/includeFiles/d/index.ts",
          },
        },
        {
          "changeStatus": "not_modified",
          "from": {
            "changeStatus": "not_modified",
            "name": "e.ts",
            "path": "src/otherFiles/e.ts",
          },
          "fullText": "{ config }",
          "kind": "depends_on",
          "to": {
            "changeStatus": "not_modified",
            "name": "config.ts",
            "path": "src/config.ts",
          },
        },
        {
          "changeStatus": "not_modified",
          "from": {
            "changeStatus": "not_modified",
            "name": "j.ts",
            "path": "src/includeFiles/abstractions/j.ts",
          },
          "fullText": "childA",
          "kind": "depends_on",
          "to": {
            "changeStatus": "not_modified",
            "name": "childA.ts",
            "path": "src/includeFiles/abstractions/children/childA.ts",
          },
        },
        {
          "changeStatus": "not_modified",
          "from": {
            "changeStatus": "not_modified",
            "name": "j.ts",
            "path": "src/includeFiles/abstractions/j.ts",
          },
          "fullText": "data",
          "kind": "depends_on",
          "to": {
            "changeStatus": "not_modified",
            "name": "data.json",
            "path": "data.json",
          },
        },
        {
          "changeStatus": "not_modified",
          "from": {
            "changeStatus": "not_modified",
            "name": "k.ts",
            "path": "src/includeFiles/abstractions/k.ts",
          },
          "fullText": "c",
          "kind": "depends_on",
          "to": {
            "changeStatus": "not_modified",
            "name": "l.ts",
            "path": "src/includeFiles/abstractions/l.ts",
          },
        },
        {
          "changeStatus": "not_modified",
          "from": {
            "changeStatus": "not_modified",
            "name": "main.ts",
            "path": "src/main.ts",
          },
          "fullText": "a",
          "kind": "depends_on",
          "to": {
            "changeStatus": "not_modified",
            "name": "a.ts",
            "path": "src/includeFiles/a.ts",
          },
        },
        {
          "changeStatus": "not_modified",
          "from": {
            "changeStatus": "not_modified",
            "name": "main.ts",
            "path": "src/main.ts",
          },
          "fullText": "b",
          "kind": "depends_on",
          "to": {
            "changeStatus": "not_modified",
            "name": "b.ts",
            "path": "src/includeFiles/b.ts",
          },
        },
        {
          "changeStatus": "not_modified",
          "from": {
            "changeStatus": "not_modified",
            "name": "main.ts",
            "path": "src/main.ts",
          },
          "fullText": "a3",
          "kind": "depends_on",
          "to": {
            "changeStatus": "not_modified",
            "name": "j.ts",
            "path": "src/includeFiles/abstractions/j.ts",
          },
        },
        {
          "changeStatus": "not_modified",
          "from": {
            "changeStatus": "not_modified",
            "name": "main.ts",
            "path": "src/main.ts",
          },
          "fullText": "b3",
          "kind": "depends_on",
          "to": {
            "changeStatus": "not_modified",
            "name": "k.ts",
            "path": "src/includeFiles/abstractions/k.ts",
          },
        },
        {
          "changeStatus": "not_modified",
          "from": {
            "changeStatus": "not_modified",
            "name": "main.ts",
            "path": "src/main.ts",
          },
          "fullText": "b2",
          "kind": "depends_on",
          "to": {
            "changeStatus": "not_modified",
            "name": "e.ts",
            "path": "src/otherFiles/e.ts",
          },
        },
      ],
    }
  `);
});

test('フルパスでinclude指定したものは、excludeに該当するファイルでも除外されない', () => {
  expect(
    filterGraph(
      [...include, 'src/includeFiles/excludeFiles/butInclude.ts'],
      exclude,
      { nodes, relations } as Graph,
    ),
  ).toMatchInlineSnapshot(`
    {
      "nodes": [
        {
          "changeStatus": "not_modified",
          "name": "b.ts",
          "path": "src/includeFiles/b.ts",
        },
        {
          "changeStatus": "not_modified",
          "name": "config.ts",
          "path": "src/config.ts",
        },
        {
          "changeStatus": "not_modified",
          "name": "c.ts",
          "path": "src/includeFiles/c.ts",
        },
        {
          "changeStatus": "not_modified",
          "name": "childA.ts",
          "path": "src/includeFiles/children/childA.ts",
        },
        {
          "changeStatus": "not_modified",
          "name": "d.ts",
          "path": "src/includeFiles/d/d.ts",
        },
        {
          "changeStatus": "not_modified",
          "name": "index.ts",
          "path": "src/includeFiles/d/index.ts",
        },
        {
          "changeStatus": "not_modified",
          "name": "a.ts",
          "path": "src/includeFiles/a.ts",
        },
        {
          "changeStatus": "not_modified",
          "name": "butInclude.ts",
          "path": "src/includeFiles/excludeFiles/butInclude.ts",
        },
        {
          "changeStatus": "not_modified",
          "name": "childA.ts",
          "path": "src/includeFiles/abstractions/children/childA.ts",
        },
        {
          "changeStatus": "not_modified",
          "name": "j.ts",
          "path": "src/includeFiles/abstractions/j.ts",
        },
        {
          "changeStatus": "not_modified",
          "name": "l.ts",
          "path": "src/includeFiles/abstractions/l.ts",
        },
        {
          "changeStatus": "not_modified",
          "name": "k.ts",
          "path": "src/includeFiles/abstractions/k.ts",
        },
        {
          "changeStatus": "not_modified",
          "name": "e.ts",
          "path": "src/otherFiles/e.ts",
        },
        {
          "changeStatus": "not_modified",
          "name": "data.json",
          "path": "data.json",
        },
        {
          "changeStatus": "not_modified",
          "name": "main.ts",
          "path": "src/main.ts",
        },
      ],
      "relations": [
        {
          "changeStatus": "not_modified",
          "from": {
            "changeStatus": "not_modified",
            "name": "b.ts",
            "path": "src/includeFiles/b.ts",
          },
          "fullText": "{ config }",
          "kind": "depends_on",
          "to": {
            "changeStatus": "not_modified",
            "name": "config.ts",
            "path": "src/config.ts",
          },
        },
        {
          "changeStatus": "not_modified",
          "from": {
            "changeStatus": "not_modified",
            "name": "c.ts",
            "path": "src/includeFiles/c.ts",
          },
          "fullText": "b",
          "kind": "depends_on",
          "to": {
            "changeStatus": "not_modified",
            "name": "b.ts",
            "path": "src/includeFiles/b.ts",
          },
        },
        {
          "changeStatus": "not_modified",
          "from": {
            "changeStatus": "not_modified",
            "name": "config.ts",
            "path": "src/config.ts",
          },
          "fullText": "C",
          "kind": "depends_on",
          "to": {
            "changeStatus": "not_modified",
            "name": "c.ts",
            "path": "src/includeFiles/c.ts",
          },
        },
        {
          "changeStatus": "not_modified",
          "from": {
            "changeStatus": "not_modified",
            "name": "index.ts",
            "path": "src/includeFiles/d/index.ts",
          },
          "fullText": "* as d",
          "kind": "depends_on",
          "to": {
            "changeStatus": "not_modified",
            "name": "d.ts",
            "path": "src/includeFiles/d/d.ts",
          },
        },
        {
          "changeStatus": "not_modified",
          "from": {
            "changeStatus": "not_modified",
            "name": "a.ts",
            "path": "src/includeFiles/a.ts",
          },
          "fullText": "childA",
          "kind": "depends_on",
          "to": {
            "changeStatus": "not_modified",
            "name": "childA.ts",
            "path": "src/includeFiles/children/childA.ts",
          },
        },
        {
          "changeStatus": "not_modified",
          "from": {
            "changeStatus": "not_modified",
            "name": "a.ts",
            "path": "src/includeFiles/a.ts",
          },
          "fullText": ";",
          "kind": "depends_on",
          "to": {
            "changeStatus": "not_modified",
            "name": "butInclude.ts",
            "path": "src/includeFiles/excludeFiles/butInclude.ts",
          },
        },
        {
          "changeStatus": "not_modified",
          "from": {
            "changeStatus": "not_modified",
            "name": "a.ts",
            "path": "src/includeFiles/a.ts",
          },
          "fullText": "function",
          "kind": "depends_on",
          "to": {
            "changeStatus": "not_modified",
            "name": "index.ts",
            "path": "src/includeFiles/d/index.ts",
          },
        },
        {
          "changeStatus": "not_modified",
          "from": {
            "changeStatus": "not_modified",
            "name": "e.ts",
            "path": "src/otherFiles/e.ts",
          },
          "fullText": "{ config }",
          "kind": "depends_on",
          "to": {
            "changeStatus": "not_modified",
            "name": "config.ts",
            "path": "src/config.ts",
          },
        },
        {
          "changeStatus": "not_modified",
          "from": {
            "changeStatus": "not_modified",
            "name": "j.ts",
            "path": "src/includeFiles/abstractions/j.ts",
          },
          "fullText": "childA",
          "kind": "depends_on",
          "to": {
            "changeStatus": "not_modified",
            "name": "childA.ts",
            "path": "src/includeFiles/abstractions/children/childA.ts",
          },
        },
        {
          "changeStatus": "not_modified",
          "from": {
            "changeStatus": "not_modified",
            "name": "j.ts",
            "path": "src/includeFiles/abstractions/j.ts",
          },
          "fullText": "data",
          "kind": "depends_on",
          "to": {
            "changeStatus": "not_modified",
            "name": "data.json",
            "path": "data.json",
          },
        },
        {
          "changeStatus": "not_modified",
          "from": {
            "changeStatus": "not_modified",
            "name": "k.ts",
            "path": "src/includeFiles/abstractions/k.ts",
          },
          "fullText": "c",
          "kind": "depends_on",
          "to": {
            "changeStatus": "not_modified",
            "name": "l.ts",
            "path": "src/includeFiles/abstractions/l.ts",
          },
        },
        {
          "changeStatus": "not_modified",
          "from": {
            "changeStatus": "not_modified",
            "name": "main.ts",
            "path": "src/main.ts",
          },
          "fullText": "a",
          "kind": "depends_on",
          "to": {
            "changeStatus": "not_modified",
            "name": "a.ts",
            "path": "src/includeFiles/a.ts",
          },
        },
        {
          "changeStatus": "not_modified",
          "from": {
            "changeStatus": "not_modified",
            "name": "main.ts",
            "path": "src/main.ts",
          },
          "fullText": "b",
          "kind": "depends_on",
          "to": {
            "changeStatus": "not_modified",
            "name": "b.ts",
            "path": "src/includeFiles/b.ts",
          },
        },
        {
          "changeStatus": "not_modified",
          "from": {
            "changeStatus": "not_modified",
            "name": "main.ts",
            "path": "src/main.ts",
          },
          "fullText": "a3",
          "kind": "depends_on",
          "to": {
            "changeStatus": "not_modified",
            "name": "j.ts",
            "path": "src/includeFiles/abstractions/j.ts",
          },
        },
        {
          "changeStatus": "not_modified",
          "from": {
            "changeStatus": "not_modified",
            "name": "main.ts",
            "path": "src/main.ts",
          },
          "fullText": "b3",
          "kind": "depends_on",
          "to": {
            "changeStatus": "not_modified",
            "name": "k.ts",
            "path": "src/includeFiles/abstractions/k.ts",
          },
        },
        {
          "changeStatus": "not_modified",
          "from": {
            "changeStatus": "not_modified",
            "name": "main.ts",
            "path": "src/main.ts",
          },
          "fullText": "b2",
          "kind": "depends_on",
          "to": {
            "changeStatus": "not_modified",
            "name": "e.ts",
            "path": "src/otherFiles/e.ts",
          },
        },
      ],
    }
  `);
});
