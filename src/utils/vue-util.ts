import path from 'path';
import fs from 'fs';
import { tmpdir } from 'os';
import ts from 'typescript';
import { pipe } from 'remeda';
import type { Graph, Node } from '../feature/graph/models';
import type { OptionValues } from '../setting/model';
import { resolveTsconfig } from './tsc-util';
import type { Tsconfig } from './tsc-util';

type RenameGraph = (graph: Graph) => Graph;

/** tmpdir にプロジェクトをコピーするなどし解析の準備を整え、その環境に合わせた tsconfig を返却する */
export function setupVueEnvironment(
  opt: Pick<OptionValues, 'dir' | 'tsconfig'>,
): [Tsconfig, RenameGraph] {
  const {
    raw: config,
    options: { rootDir },
  } = resolveTsconfig(opt);

  const relativeRootDir = pipe(path.relative(process.cwd(), rootDir), str =>
    str === '' ? './' : str,
  );

  // vue と TS ファイルのパスを保持する。その際、すでに *.vue.ts ファイルが存在している場合は対象外とする。
  const vueAndTsFilePaths = getVueAndTsFilePathsRecursive(
    relativeRootDir,
  ).filter(path => !fs.existsSync(`${path}.ts`));

  const tmpDir = fs.mkdtempSync(path.join(tmpdir(), 'tsg-vue-'));
  console.log('tmpDir:', tmpDir);
  vueAndTsFilePaths
    .map(fullPath => path.relative(process.cwd(), fullPath))
    .forEach(relativeFilePath => {
      const tmpFilePath = path.join(
        tmpDir,
        // *.vue のファイルは *.vue.ts としてコピー
        relativeFilePath.endsWith('.vue')
          ? relativeFilePath + '.ts'
          : relativeFilePath,
      );
      if (!tmpFilePath.startsWith(tmpDir)) {
        // tmpDir 以外へのコピーを抑止する
        return;
      }
      fs.mkdirSync(path.dirname(tmpFilePath), { recursive: true });
      fs.copyFileSync(relativeFilePath, tmpFilePath);
    });

  const tsconfig = ts.parseJsonConfigFileContent(
    config,
    ts.sys,
    path.join(tmpDir, relativeRootDir),
  );
  // rootDir を設定しない場合、 tmpDir/rootDir である場合に `rootDir/` が node についてしまう
  tsconfig.options.rootDir = path.join(tmpDir, relativeRootDir);
  return [tsconfig as Tsconfig, bind_renameGraph(tmpDir)] as const;
}

function getVueAndTsFilePathsRecursive(
  dir: string,
  mut_filePaths: string[] = [],
): string[] {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (
      fs.statSync(filePath).isDirectory() &&
      !filePath.includes('node_modules')
    ) {
      // ディレクトリの場合は再帰的に呼び出す
      return getVueAndTsFilePathsRecursive(filePath, mut_filePaths);
    }

    if (
      // ts.Extension and vue
      [
        '.ts',
        '.tsx',
        '.d.ts',
        '.js',
        '.jsx',
        '.json',
        '.tsbuildinfo',
        '.mjs',
        '.mts',
        '.d.mts',
        '.cjs',
        '.cts',
        '.d.cts',
        '.vue',
      ].some(ext => filePath.endsWith(ext))
    ) {
      mut_filePaths.push(filePath);
    }
  });
  return mut_filePaths;
}

function bind_renameNode(tmpDir: string): (node: Node) => Node {
  return (node: Node) => ({
    ...node,
    path: node.path
      .replace('.vue.ts', '.vue')
      .replace(`${tmpDir.slice(1)}/`, ''),
    name: node.name
      .replace('.vue.ts', '.vue')
      .replace(`${tmpDir.slice(1)}/`, ''),
  });
}

function bind_renameGraph(tmpDir: string): RenameGraph {
  const renameNode = bind_renameNode(tmpDir);
  return (graph: Graph) => ({
    nodes: graph.nodes.map(renameNode),
    relations: graph.relations.map(relation => {
      return {
        ...relation,
        from: renameNode(relation.from),
        to: renameNode(relation.to),
      };
    }),
  });
}
