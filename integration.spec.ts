import fs from 'fs';
import path from 'path';
import { beforeAll, expect, test } from 'vitest';
import { $ } from 'zx';

const dir = '__tmp__';
const filename = 'test.md';
const filepath = path.join(dir, filename);

beforeAll(async () => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  await $`npm run build`;
});

// TODO 現状、--config-file で指定するパスは -d からの相対パスだが、将来的には -d をなくしたい。その移行のため --config-file での指定は、-d を無視したカレントディレクトリからの相対パスで設定ファイルを優先し、なければ -d からの相対パスで探すようにしたい。

test('run:sample', async () => {
  await $`node ./bin/tsg.js --tsconfig './dummy_project/tsconfig.json' --md ${filepath}`;

  const file = fs.readFileSync(filepath, { encoding: 'utf-8' });
  expect(file).toMatchInlineSnapshot(`
    "# TypeScript Graph

    \`\`\`bash
    tsg --tsconfig ./dummy_project/tsconfig.json --md __tmp__/test.md
    \`\`\`

    \`\`\`mermaid
    flowchart
        subgraph src["src"]
            src/utils.ts["utils.ts"]
            src/config.ts["config.ts"]
            src/main.ts["main.ts"]
            subgraph src/includeFiles["/includeFiles"]
                src/includeFiles/b.ts["b.ts"]
                src/includeFiles/c.ts["c.ts"]
                src/includeFiles/a.ts["a.ts"]
                subgraph src/includeFiles/children["/children"]
                    src/includeFiles/children/childA.ts["childA.ts"]
                end
                subgraph src/includeFiles/excludeFiles["/excludeFiles"]
                    src/includeFiles/excludeFiles/i.ts["i.ts"]
                    src/includeFiles/excludeFiles/g.ts["g.ts"]
                    src/includeFiles/excludeFiles/h.ts["h.ts"]
                    subgraph src/includeFiles/excludeFiles/style_["/style"]
                        src/includeFiles/excludeFiles/style_/style_.ts["style.ts"]
                    end
                    subgraph src/includeFiles/excludeFiles/class_["/class"]
                        src/includeFiles/excludeFiles/class_/class_A.ts["classA.ts"]
                    end
                end
                subgraph src/includeFiles/d["/d"]
                    src/includeFiles/d/d.ts["d.ts"]
                    src/includeFiles/d/index.ts["index.ts"]
                end
                subgraph src/includeFiles/abstractions["/abstractions"]
                    src/includeFiles/abstractions/j.ts["j.ts"]
                    src/includeFiles/abstractions/l.ts["l.ts"]
                    src/includeFiles/abstractions/k.ts["k.ts"]
                    subgraph src/includeFiles/abstractions/children["/children"]
                        src/includeFiles/abstractions/children/childA.ts["childA.ts"]
                    end
                end
            end
            subgraph src/otherFiles["/otherFiles"]
                src/otherFiles/d.ts["d.ts"]
                src/otherFiles/f.ts["f.ts"]
                src/otherFiles/e.ts["e.ts"]
                subgraph src/otherFiles/children["/children"]
                    src/otherFiles/children/:id.json[":id.json"]
                    src/otherFiles/children///id//.json["{id}.json"]
                    src/otherFiles/children/childA.ts["childA.ts"]
                end
            end
        end
        src/includeFiles/b.ts-->src/utils.ts
        src/includeFiles/b.ts-->src/config.ts
        src/includeFiles/c.ts-->src/utils.ts
        src/includeFiles/c.ts-->src/includeFiles/b.ts
        src/config.ts-->src/utils.ts
        src/config.ts-->src/includeFiles/c.ts
        src/includeFiles/children/childA.ts-->src/utils.ts
        src/includeFiles/excludeFiles/i.ts-->src/utils.ts
        src/includeFiles/d/index.ts-->src/includeFiles/d/d.ts
        src/includeFiles/a.ts-->src/includeFiles/children/childA.ts
        src/includeFiles/a.ts-->src/includeFiles/excludeFiles/g.ts
        src/includeFiles/a.ts-->src/includeFiles/excludeFiles/i.ts
        src/includeFiles/a.ts-->src/includeFiles/excludeFiles/style_/style_.ts
        src/includeFiles/a.ts-->src/includeFiles/excludeFiles/class_/class_A.ts
        src/includeFiles/a.ts-->src/includeFiles/excludeFiles/h.ts
        src/includeFiles/a.ts-->src/includeFiles/d/index.ts
        src/includeFiles/a.ts-->src/utils.ts
        src/otherFiles/children/childA.ts-->src/utils.ts
        src/otherFiles/children/childA.ts-->src/otherFiles/children/:id.json
        src/otherFiles/children/childA.ts-->src/otherFiles/children///id//.json
        src/otherFiles/d.ts-->src/otherFiles/children/childA.ts
        src/otherFiles/d.ts-->src/utils.ts
        src/otherFiles/f.ts-->src/utils.ts
        src/otherFiles/e.ts-->src/otherFiles/f.ts
        src/otherFiles/e.ts-->src/utils.ts
        src/otherFiles/e.ts-->src/config.ts
        src/includeFiles/abstractions/j.ts-->src/utils.ts
        src/includeFiles/abstractions/j.ts-->src/includeFiles/abstractions/children/childA.ts
        src/includeFiles/abstractions/j.ts-->data.json
        src/includeFiles/abstractions/l.ts-->src/utils.ts
        src/includeFiles/abstractions/k.ts-->src/includeFiles/abstractions/l.ts
        src/includeFiles/abstractions/k.ts-->src/utils.ts
        src/main.ts-->src/includeFiles/a.ts
        src/main.ts-->src/includeFiles/b.ts
        src/main.ts-->src/otherFiles/d.ts
        src/main.ts-->src/otherFiles/e.ts
        src/main.ts-->src/includeFiles/abstractions/j.ts
        src/main.ts-->src/includeFiles/abstractions/k.ts
        src/main.ts-->src/utils.ts
    \`\`\`

    "
  `);
});

test('run:sample:argument-include', async () => {
  await $`node ./bin/tsg.js includeFiles config --tsconfig './dummy_project/tsconfig.json' --md ${filepath}`;

  const file = fs.readFileSync(filepath, { encoding: 'utf-8' });
  expect(file).toMatchInlineSnapshot(`
    "# TypeScript Graph

    \`\`\`bash
    tsg includeFiles config --tsconfig ./dummy_project/tsconfig.json --md __tmp__/test.md
    \`\`\`

    \`\`\`mermaid
    flowchart
        subgraph src["src"]
            src/config.ts["config.ts"]
            src/utils.ts["utils.ts"]
            src/main.ts["main.ts"]
            subgraph src/includeFiles["/includeFiles"]
                src/includeFiles/b.ts["b.ts"]
                src/includeFiles/c.ts["c.ts"]
                src/includeFiles/a.ts["a.ts"]
                subgraph src/includeFiles/children["/children"]
                    src/includeFiles/children/childA.ts["childA.ts"]
                end
                subgraph src/includeFiles/excludeFiles["/excludeFiles"]
                    src/includeFiles/excludeFiles/i.ts["i.ts"]
                    src/includeFiles/excludeFiles/g.ts["g.ts"]
                    src/includeFiles/excludeFiles/h.ts["h.ts"]
                    subgraph src/includeFiles/excludeFiles/style_["/style"]
                        src/includeFiles/excludeFiles/style_/style_.ts["style.ts"]
                    end
                    subgraph src/includeFiles/excludeFiles/class_["/class"]
                        src/includeFiles/excludeFiles/class_/class_A.ts["classA.ts"]
                    end
                end
                subgraph src/includeFiles/d["/d"]
                    src/includeFiles/d/d.ts["d.ts"]
                    src/includeFiles/d/index.ts["index.ts"]
                end
                subgraph src/includeFiles/abstractions["/abstractions"]
                    src/includeFiles/abstractions/j.ts["j.ts"]
                    src/includeFiles/abstractions/l.ts["l.ts"]
                    src/includeFiles/abstractions/k.ts["k.ts"]
                    subgraph src/includeFiles/abstractions/children["/children"]
                        src/includeFiles/abstractions/children/childA.ts["childA.ts"]
                    end
                end
            end
            subgraph src/otherFiles["/otherFiles"]
                src/otherFiles/e.ts["e.ts"]
            end
        end
        src/includeFiles/b.ts-->src/utils.ts
        src/includeFiles/b.ts-->src/config.ts
        src/includeFiles/c.ts-->src/utils.ts
        src/includeFiles/c.ts-->src/includeFiles/b.ts
        src/config.ts-->src/utils.ts
        src/config.ts-->src/includeFiles/c.ts
        src/includeFiles/children/childA.ts-->src/utils.ts
        src/includeFiles/excludeFiles/i.ts-->src/utils.ts
        src/includeFiles/d/index.ts-->src/includeFiles/d/d.ts
        src/includeFiles/a.ts-->src/includeFiles/children/childA.ts
        src/includeFiles/a.ts-->src/includeFiles/excludeFiles/g.ts
        src/includeFiles/a.ts-->src/includeFiles/excludeFiles/i.ts
        src/includeFiles/a.ts-->src/includeFiles/excludeFiles/style_/style_.ts
        src/includeFiles/a.ts-->src/includeFiles/excludeFiles/class_/class_A.ts
        src/includeFiles/a.ts-->src/includeFiles/excludeFiles/h.ts
        src/includeFiles/a.ts-->src/includeFiles/d/index.ts
        src/includeFiles/a.ts-->src/utils.ts
        src/otherFiles/e.ts-->src/config.ts
        src/includeFiles/abstractions/j.ts-->src/utils.ts
        src/includeFiles/abstractions/j.ts-->src/includeFiles/abstractions/children/childA.ts
        src/includeFiles/abstractions/j.ts-->data.json
        src/includeFiles/abstractions/l.ts-->src/utils.ts
        src/includeFiles/abstractions/k.ts-->src/includeFiles/abstractions/l.ts
        src/includeFiles/abstractions/k.ts-->src/utils.ts
        src/main.ts-->src/includeFiles/a.ts
        src/main.ts-->src/includeFiles/b.ts
        src/main.ts-->src/includeFiles/abstractions/j.ts
        src/main.ts-->src/includeFiles/abstractions/k.ts
        src/otherFiles/e.ts-->src/utils.ts
        src/main.ts-->src/otherFiles/e.ts
        src/main.ts-->src/utils.ts
    \`\`\`

    "
  `);
});

test('run:sample:include', async () => {
  await $`node ./bin/tsg.js --tsconfig './dummy_project/tsconfig.json' --include includeFiles config --md ${filepath}`;

  const file = fs.readFileSync(filepath, { encoding: 'utf-8' });
  expect(file).toMatchInlineSnapshot(`
    "# TypeScript Graph

    \`\`\`bash
    tsg --tsconfig ./dummy_project/tsconfig.json --include includeFiles config --md __tmp__/test.md
    \`\`\`

    \`\`\`mermaid
    flowchart
        subgraph src["src"]
            src/config.ts["config.ts"]
            src/utils.ts["utils.ts"]
            src/main.ts["main.ts"]
            subgraph src/includeFiles["/includeFiles"]
                src/includeFiles/b.ts["b.ts"]
                src/includeFiles/c.ts["c.ts"]
                src/includeFiles/a.ts["a.ts"]
                subgraph src/includeFiles/children["/children"]
                    src/includeFiles/children/childA.ts["childA.ts"]
                end
                subgraph src/includeFiles/excludeFiles["/excludeFiles"]
                    src/includeFiles/excludeFiles/i.ts["i.ts"]
                    src/includeFiles/excludeFiles/g.ts["g.ts"]
                    src/includeFiles/excludeFiles/h.ts["h.ts"]
                    subgraph src/includeFiles/excludeFiles/style_["/style"]
                        src/includeFiles/excludeFiles/style_/style_.ts["style.ts"]
                    end
                    subgraph src/includeFiles/excludeFiles/class_["/class"]
                        src/includeFiles/excludeFiles/class_/class_A.ts["classA.ts"]
                    end
                end
                subgraph src/includeFiles/d["/d"]
                    src/includeFiles/d/d.ts["d.ts"]
                    src/includeFiles/d/index.ts["index.ts"]
                end
                subgraph src/includeFiles/abstractions["/abstractions"]
                    src/includeFiles/abstractions/j.ts["j.ts"]
                    src/includeFiles/abstractions/l.ts["l.ts"]
                    src/includeFiles/abstractions/k.ts["k.ts"]
                    subgraph src/includeFiles/abstractions/children["/children"]
                        src/includeFiles/abstractions/children/childA.ts["childA.ts"]
                    end
                end
            end
            subgraph src/otherFiles["/otherFiles"]
                src/otherFiles/e.ts["e.ts"]
            end
        end
        src/includeFiles/b.ts-->src/utils.ts
        src/includeFiles/b.ts-->src/config.ts
        src/includeFiles/c.ts-->src/utils.ts
        src/includeFiles/c.ts-->src/includeFiles/b.ts
        src/config.ts-->src/utils.ts
        src/config.ts-->src/includeFiles/c.ts
        src/includeFiles/children/childA.ts-->src/utils.ts
        src/includeFiles/excludeFiles/i.ts-->src/utils.ts
        src/includeFiles/d/index.ts-->src/includeFiles/d/d.ts
        src/includeFiles/a.ts-->src/includeFiles/children/childA.ts
        src/includeFiles/a.ts-->src/includeFiles/excludeFiles/g.ts
        src/includeFiles/a.ts-->src/includeFiles/excludeFiles/i.ts
        src/includeFiles/a.ts-->src/includeFiles/excludeFiles/style_/style_.ts
        src/includeFiles/a.ts-->src/includeFiles/excludeFiles/class_/class_A.ts
        src/includeFiles/a.ts-->src/includeFiles/excludeFiles/h.ts
        src/includeFiles/a.ts-->src/includeFiles/d/index.ts
        src/includeFiles/a.ts-->src/utils.ts
        src/otherFiles/e.ts-->src/config.ts
        src/includeFiles/abstractions/j.ts-->src/utils.ts
        src/includeFiles/abstractions/j.ts-->src/includeFiles/abstractions/children/childA.ts
        src/includeFiles/abstractions/j.ts-->data.json
        src/includeFiles/abstractions/l.ts-->src/utils.ts
        src/includeFiles/abstractions/k.ts-->src/includeFiles/abstractions/l.ts
        src/includeFiles/abstractions/k.ts-->src/utils.ts
        src/main.ts-->src/includeFiles/a.ts
        src/main.ts-->src/includeFiles/b.ts
        src/main.ts-->src/includeFiles/abstractions/j.ts
        src/main.ts-->src/includeFiles/abstractions/k.ts
        src/otherFiles/e.ts-->src/utils.ts
        src/main.ts-->src/otherFiles/e.ts
        src/main.ts-->src/utils.ts
    \`\`\`

    "
  `);
});

test('run:sample:exclude', async () => {
  await $`node ./bin/tsg.js --tsconfig './dummy_project/tsconfig.json' --include includeFiles config --exclude excludeFiles utils --md ${filepath}`;

  const file = fs.readFileSync(filepath, { encoding: 'utf-8' });
  expect(file).toMatchInlineSnapshot(`
    "# TypeScript Graph

    \`\`\`bash
    tsg --tsconfig ./dummy_project/tsconfig.json --include includeFiles config --exclude excludeFiles utils --md __tmp__/test.md
    \`\`\`

    \`\`\`mermaid
    flowchart
        subgraph src["src"]
            src/config.ts["config.ts"]
            src/main.ts["main.ts"]
            subgraph src/includeFiles["/includeFiles"]
                src/includeFiles/b.ts["b.ts"]
                src/includeFiles/c.ts["c.ts"]
                src/includeFiles/a.ts["a.ts"]
                subgraph src/includeFiles/children["/children"]
                    src/includeFiles/children/childA.ts["childA.ts"]
                end
                subgraph src/includeFiles/d["/d"]
                    src/includeFiles/d/d.ts["d.ts"]
                    src/includeFiles/d/index.ts["index.ts"]
                end
                subgraph src/includeFiles/abstractions["/abstractions"]
                    src/includeFiles/abstractions/j.ts["j.ts"]
                    src/includeFiles/abstractions/l.ts["l.ts"]
                    src/includeFiles/abstractions/k.ts["k.ts"]
                    subgraph src/includeFiles/abstractions/children["/children"]
                        src/includeFiles/abstractions/children/childA.ts["childA.ts"]
                    end
                end
            end
            subgraph src/otherFiles["/otherFiles"]
                src/otherFiles/e.ts["e.ts"]
            end
        end
        src/includeFiles/b.ts-->src/config.ts
        src/includeFiles/c.ts-->src/includeFiles/b.ts
        src/config.ts-->src/includeFiles/c.ts
        src/includeFiles/d/index.ts-->src/includeFiles/d/d.ts
        src/includeFiles/a.ts-->src/includeFiles/children/childA.ts
        src/includeFiles/a.ts-->src/includeFiles/d/index.ts
        src/otherFiles/e.ts-->src/config.ts
        src/includeFiles/abstractions/j.ts-->src/includeFiles/abstractions/children/childA.ts
        src/includeFiles/abstractions/j.ts-->data.json
        src/includeFiles/abstractions/k.ts-->src/includeFiles/abstractions/l.ts
        src/main.ts-->src/includeFiles/a.ts
        src/main.ts-->src/includeFiles/b.ts
        src/main.ts-->src/includeFiles/abstractions/j.ts
        src/main.ts-->src/includeFiles/abstractions/k.ts
        src/main.ts-->src/otherFiles/e.ts
    \`\`\`

    "
  `);
});

test('run:sample:abstraction', async () => {
  await $`node ./bin/tsg.js --tsconfig './dummy_project/tsconfig.json' --include includeFiles config --exclude excludeFiles utils --abstraction abstractions --md ${filepath}`;

  const file = fs.readFileSync(filepath, { encoding: 'utf-8' });
  expect(file).toMatchInlineSnapshot(`
    "# TypeScript Graph

    \`\`\`bash
    tsg --tsconfig ./dummy_project/tsconfig.json --include includeFiles config --exclude excludeFiles utils --abstraction abstractions --md __tmp__/test.md
    \`\`\`

    \`\`\`mermaid
    flowchart
        classDef dir fill:#0000,stroke:#999
        subgraph src["src"]
            src/config.ts["config.ts"]
            src/main.ts["main.ts"]
            subgraph src/includeFiles["/includeFiles"]
                src/includeFiles/b.ts["b.ts"]
                src/includeFiles/c.ts["c.ts"]
                src/includeFiles/a.ts["a.ts"]
                src/includeFiles/abstractions["/abstractions"]:::dir
                subgraph src/includeFiles/children["/children"]
                    src/includeFiles/children/childA.ts["childA.ts"]
                end
                subgraph src/includeFiles/d["/d"]
                    src/includeFiles/d/d.ts["d.ts"]
                    src/includeFiles/d/index.ts["index.ts"]
                end
            end
            subgraph src/otherFiles["/otherFiles"]
                src/otherFiles/e.ts["e.ts"]
            end
        end
        src/includeFiles/b.ts-->src/config.ts
        src/includeFiles/c.ts-->src/includeFiles/b.ts
        src/config.ts-->src/includeFiles/c.ts
        src/includeFiles/d/index.ts-->src/includeFiles/d/d.ts
        src/includeFiles/a.ts-->src/includeFiles/children/childA.ts
        src/includeFiles/a.ts-->src/includeFiles/d/index.ts
        src/otherFiles/e.ts-->src/config.ts
        src/includeFiles/abstractions-->data.json
        src/main.ts-->src/includeFiles/a.ts
        src/main.ts-->src/includeFiles/b.ts
        src/main.ts-->src/includeFiles/abstractions
        src/main.ts-->src/otherFiles/e.ts
    \`\`\`

    "
  `);
});

test('run:sample:highlight', async () => {
  await $`node ./bin/tsg.js --tsconfig './dummy_project/tsconfig.json' --include includeFiles config --exclude excludeFiles utils --abstraction abstractions --highlight config.ts b.ts --md ${filepath}`;

  const file = fs.readFileSync(filepath, { encoding: 'utf-8' });
  expect(file).toMatchInlineSnapshot(`
    "# TypeScript Graph

    \`\`\`bash
    tsg --tsconfig ./dummy_project/tsconfig.json --include includeFiles config --exclude excludeFiles utils --abstraction abstractions --highlight config.ts b.ts --md __tmp__/test.md
    \`\`\`

    \`\`\`mermaid
    flowchart
        classDef dir fill:#0000,stroke:#999
        classDef highlight fill:yellow,color:black
        subgraph src["src"]
            src/config.ts["config.ts"]:::highlight
            src/main.ts["main.ts"]
            subgraph src/includeFiles["/includeFiles"]
                src/includeFiles/b.ts["b.ts"]:::highlight
                src/includeFiles/c.ts["c.ts"]
                src/includeFiles/a.ts["a.ts"]
                src/includeFiles/abstractions["/abstractions"]:::dir
                subgraph src/includeFiles/children["/children"]
                    src/includeFiles/children/childA.ts["childA.ts"]
                end
                subgraph src/includeFiles/d["/d"]
                    src/includeFiles/d/d.ts["d.ts"]
                    src/includeFiles/d/index.ts["index.ts"]
                end
            end
            subgraph src/otherFiles["/otherFiles"]
                src/otherFiles/e.ts["e.ts"]
            end
        end
        src/includeFiles/b.ts-->src/config.ts
        src/includeFiles/c.ts-->src/includeFiles/b.ts
        src/config.ts-->src/includeFiles/c.ts
        src/includeFiles/d/index.ts-->src/includeFiles/d/d.ts
        src/includeFiles/a.ts-->src/includeFiles/children/childA.ts
        src/includeFiles/a.ts-->src/includeFiles/d/index.ts
        src/otherFiles/e.ts-->src/config.ts
        src/includeFiles/abstractions-->data.json
        src/main.ts-->src/includeFiles/a.ts
        src/main.ts-->src/includeFiles/b.ts
        src/main.ts-->src/includeFiles/abstractions
        src/main.ts-->src/otherFiles/e.ts
    \`\`\`

    "
  `);
});


test('run:sample:stdout-output', async () => {
  const result = await $`node ./bin/tsg.js --tsconfig './dummy_project/tsconfig.json' --include includeFiles config --exclude excludeFiles utils --stdout`;
  
  const output = result.stdout;
  
  // Test section headers
  expect(output).toContain('=== DEPENDENCY GRAPH ===');
  expect(output).toContain('=== CODE METRICS ===');
  
  // Test dependency graph section contains Mermaid
  expect(output).toContain('flowchart');
  expect(output).toContain('subgraph');
  expect(output).toContain('-->');
  expect(output).toContain('src/includeFiles/c.ts');
  expect(output).toContain('src/config.ts');
  expect(output).toContain('src/config.ts-->src/includeFiles/c.ts');
  
  // Test metrics section contains JSON
  expect(output).toContain('"metadata"');
  expect(output).toContain('"metrics"');
  expect(output).toContain('"filePath"');
  expect(output).toContain('"maintainabilityIndex"');
  expect(output).toContain('"cyclomaticComplexity"');
  expect(output).toContain('"cognitiveComplexity"');
  
  // Test that metrics contains expected files
  expect(output).toContain('"filePath": "src/config.ts"');
  expect(output).toContain('"filePath": "src/includeFiles/c.ts"');
  
  // Ensure proper JSON structure (no markdown wrappers)
  expect(output).not.toContain('```mermaid');
  expect(output).not.toContain('```json');
  expect(output).not.toContain('```');
});
