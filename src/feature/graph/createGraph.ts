import path from 'path';
import fs from 'fs';
import { tmpdir } from 'os';
import * as ts from 'typescript';
import { Graph, Meta, Node } from './models';
import { isNot, pipe } from 'remeda';
import { mergeGraph } from './utils';
import { OptionValues } from '../../setting/model';
import ProjectTraverser from '../util/ProjectTraverser';
import { GraphAnalyzer } from './GraphAnalyzer';
import { resolveTsconfig } from '../../utils/tsc-util';

export function createGraph(
  /**
   * exclude で指定されたファイルの除外のみファイル読み込み時にも実施する。
   *
   * include をによる絞り込みを行わない理由は、include から参照される include 指定されていないファイルをここで除外したくないため。
   * exclude は、ユーザーが明確に不要と指定しているため、たとえ include に含まれたり include 対象ファイルと関連をもつファイルであったとしても除外して良い。
   **/
  opt: Pick<OptionValues, 'exclude' | 'dir' | 'tsconfig' | 'vue'>,
): { graph: Graph; meta: Meta } {
  const bindWords_isFileNameMatchSomeWords =
    (array: string[]) => (filename: string) =>
      array.some(word => filename.includes(word));
  const isMatchSomeExclude = opt.exclude
    ? bindWords_isFileNameMatchSomeWords(opt.exclude)
    : () => false;
  const isNotMatchSomeExclude = isNot(isMatchSomeExclude);

  const tsconfig = resolveTsconfig(opt);
  if (!opt.vue) {
    const traverser = new ProjectTraverser(tsconfig, ts.sys);
    const reuslt = traverser.traverse(
      isNotMatchSomeExclude,
      (...args) => new GraphAnalyzer(...args),
    );
    const graphs = reuslt.map(([analyzer]) => analyzer.generateGraph());

    return {
      graph: mergeGraph(graphs),
      meta: { rootDir: tsconfig.options.rootDir },
    };
  } else {
    const graph = createGraphForVue(
      tsconfig.options.rootDir!,
      tsconfig.raw,
      isNotMatchSomeExclude,
    );
    return { graph, meta: { rootDir: tsconfig.options.rootDir } };
  }
}

function createGraphForVue(
  rootDir: string,
  config: any,
  isNotMatchSomeExclude: (filename: string) => boolean,
) {
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
  // ↑ここまでで、ファイルを tmp にコピーし、新たな fileNames と options を生成する

  const traverser = new ProjectTraverser(tsconfig, ts.sys);
  const reuslt = traverser.traverse(
    isNotMatchSomeExclude,
    (...args) => new GraphAnalyzer(...args),
  );

  function renameNode(node: Node) {
    return {
      ...node,
      path: node.path
        .replace('.vue.ts', '.vue')
        .replace(`${tmpDir.slice(1)}/`, ''),
      name: node.name
        .replace('.vue.ts', '.vue')
        .replace(`${tmpDir.slice(1)}/`, ''),
    };
  }

  const graphs = reuslt
    .map(([analyzer]) => analyzer.generateGraph())
    .map(graph => {
      // graph においては .vue.ts ファイルを .vue に戻す
      return {
        nodes: graph.nodes.map(renameNode),
        relations: graph.relations.map(relation => {
          return {
            ...relation,
            from: renameNode(relation.from),
            to: renameNode(relation.to),
          };
        }),
      };
    });
  return mergeGraph(graphs);
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
