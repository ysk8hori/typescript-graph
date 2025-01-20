import { test, expect, describe } from 'vitest';
import type { Graph, Node, Relation } from '../../feature/graph/models';
import { setupConfig } from '../../setting/config';
import { filterGraph } from './filterGraph';
import include from './filterGraph.spec.data/include.json';
import exclude from './filterGraph.spec.data/exclude.json';
import nodes from './filterGraph.spec.data/nodes.json';
import relations from './filterGraph.spec.data/relations.json';

describe('シンプルなテスト', () => {
  const mainNode = {
    path: 'src/main.ts',
    changeStatus: 'not_modified',
    name: 'main.ts',
  } satisfies Node;

  const testNode = {
    path: 'src/main.test.ts',
    changeStatus: 'not_modified',
    name: 'main.test.ts',
  } satisfies Node;

  const utilNode = {
    path: 'src/util.ts',
    changeStatus: 'not_modified',
    name: 'util.ts',
  } satisfies Node;

  const testToMain = {
    from: testNode,
    to: mainNode,
    changeStatus: 'not_modified',
    kind: 'depends_on',
  } satisfies Relation;

  const testToUtil = {
    from: testNode,
    to: utilNode,
    changeStatus: 'not_modified',
    kind: 'depends_on',
  } satisfies Relation;

  const mainToUtil = {
    from: mainNode,
    to: utilNode,
    changeStatus: 'not_modified',
    kind: 'depends_on',
  } satisfies Relation;

  const graph = {
    nodes: [mainNode, testNode, utilNode],
    relations: [mainToUtil, testToMain, testToUtil],
  } satisfies Graph;

  test('include も exclude も指定しない', () => {
    setupConfig('./src/graph/filterGraph.spec.data/noconfig.json');
    expect(filterGraph([], [], graph)).toEqual(graph);
  });

  test('include 指定せず test と utils を exclude できる', () => {
    setupConfig('./src/graph/filterGraph.spec.data/noconfig.json');
    expect(filterGraph([], ['.test.', 'util'], graph)).toEqual({
      nodes: [mainNode],
      relations: [],
    } satisfies Graph);
  });

  test('すべてを含むゆるい include を 指定しても test と utils を exclude できる', () => {
    setupConfig('./src/graph/filterGraph.spec.data/noconfig.json');
    expect(filterGraph(['src'], ['.test.', 'util'], graph)).toEqual({
      nodes: [mainNode],
      relations: [],
    } satisfies Graph);
  });

  test('exclude 対象外のファイルを include でフルパス指定しても test と utils を exclude できる', () => {
    setupConfig('./src/graph/filterGraph.spec.data/noconfig.json');
    expect(filterGraph([mainNode.path], ['.test.', 'util'], graph)).toEqual({
      nodes: [mainNode],
      relations: [],
    } satisfies Graph);
  });

  describe('exclude 対象のファイルを include でフルパス指定すれば結果に含めることができるが、excludeからexcludeへのrelationは含めない', () => {
    test('to (utilNode) を include でフルパス指定', () => {
      setupConfig('./src/graph/filterGraph.spec.data/noconfig.json');
      expect(filterGraph([utilNode.path], ['.test.', 'util'], graph)).toEqual({
        nodes: [utilNode, mainNode], // main と util の順序は制御できていないが、現状ではどちらでも良い
        relations: [mainToUtil],
      } satisfies Graph);
    });
    test('from (testNode) を include でフルパス指定', () => {
      setupConfig('./src/graph/filterGraph.spec.data/noconfig.json');
      expect(filterGraph([testNode.path], ['.test.', 'util'], graph)).toEqual({
        nodes: [testNode, mainNode], // main と util の順序は制御できていないが、現状ではどちらでも良い
        relations: [testToMain],
      } satisfies Graph);
    });
  });
  test('exclude 対象のファイルを include でフルパス指定すれば結果に含めることができ、excludeからexcludeへのrelationも両方のノードをフルパス指定していれば含めることができる', () => {
    setupConfig('./src/graph/filterGraph.spec.data/noconfig.json');
    expect(
      filterGraph([testNode.path, utilNode.path], ['.test.', 'util'], graph),
    ).toEqual({
      nodes: [testNode, utilNode, mainNode], // main と util の順序は制御できていないが、現状ではどちらでも良い
      relations: [mainToUtil, testToMain, testToUtil], // main と util の順序は制御できていないが、現状ではどちらでも良い
    } satisfies Graph);
  });

  test.skip('include 対象のテストを exclude できる', () => {
    setupConfig('./src/graph/filterGraph.spec.data/noconfig.json');
    expect(filterGraph(['src/a.ts'], ['test'], graph)).toEqual({
      nodes: [mainNode],
      relations: [],
    } satisfies Graph);
  });
});

test('サンプルに対するテスト', () => {
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
