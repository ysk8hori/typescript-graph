import path from 'path';
import fs from 'fs';
import { tmpdir } from 'os';
import * as ts from 'typescript';
import { Graph, Meta, Node } from './models';
import { pipe, piped } from 'remeda';
import { mergeGraph } from './utils';
import { OptionValues } from '../../setting/model';
import { analyzeSoucreFile } from './analyzeSoucreFile';

export function createGraph(
  /**
   * exclude で指定されたファイルの除外のみファイル読み込み時にも実施する。
   *
   * include をによる絞り込みを行わない理由は、include から参照される include 指定されていないファイルをここで除外したくないため。
   * exclude は、ユーザーが明確に不要と指定しているため、たとえ include に含まれたり include 対象ファイルと関連をもつファイルであったとしても除外して良い。
   **/
  opt: Pick<OptionValues, 'exclude' | 'dir' | 'tsconfig' | 'vue'>,
): { graph: Graph; meta: Meta } {
  const configPath = opt.tsconfig
    ? path.resolve(opt.tsconfig)
    : ts.findConfigFile(path.resolve(opt.dir ?? './'), ts.sys.fileExists);
  if (!configPath) {
    throw new Error('Could not find a valid "tsconfig.json".');
  }
  const { config } = ts.readConfigFile(configPath, ts.sys.readFile);
  const splitedConfigPath = configPath.split('/');
  const rootDir = splitedConfigPath
    .slice(0, splitedConfigPath.length - 1)
    .join('/');

  const bindWords_isFileNameMatchSomeWords =
    (array: string[]) => (filename: string) =>
      array.some(word => filename.includes(word));
  const isMatchSomeExclude = opt.exclude
    ? bindWords_isFileNameMatchSomeWords(opt.exclude)
    : () => false;
  const isNotMatchSomeExclude = (filename: string) =>
    !isMatchSomeExclude(filename);

  if (!opt.vue) {
    const { options, fileNames: fullFilePaths } = ts.parseJsonConfigFileContent(
      config,
      ts.sys,
      rootDir,
    );
    options.rootDir = rootDir;
    const program = ts.createProgram(fullFilePaths, options);
    const graphs = program
      .getSourceFiles()
      .filter(sourceFile => !sourceFile.fileName.includes('node_modules')) // node_modules 配下のファイルは除外
      .filter(piped(getFilePath(options), removeSlash, isNotMatchSomeExclude))
      .map(analyzeSoucreFile(options));
    return { graph: mergeGraph(...graphs), meta: { rootDir } };
  } else {
    const graph = createGraphForVue(rootDir, config, isNotMatchSomeExclude);
    return { graph, meta: { rootDir } };
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

  const { options, fileNames: fullFilePaths } = ts.parseJsonConfigFileContent(
    config,
    ts.sys,
    path.join(tmpDir, relativeRootDir),
  );
  // rootDir を設定しない場合、 tmpDir/rootDir である場合に `rootDir/` が node についてしまう
  options.rootDir = path.join(tmpDir, relativeRootDir);
  // ↑ここまでで、ファイルを tmp にコピーし、新たな fileNames と options を生成する
  const program = ts.createProgram(fullFilePaths, options);
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
  const graphs = program
    .getSourceFiles()
    .filter(sourceFile => !sourceFile.fileName.includes('node_modules')) // node_modules 配下のファイルは除外
    .filter(piped(getFilePath(options), removeSlash, isNotMatchSomeExclude))
    .map(analyzeSoucreFile(options))
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
  return mergeGraph(...graphs);
}

function removeSlash(pathName: string): string {
  return pathName.startsWith('/') ? pathName.replace('/', '') : pathName;
}

function getFilePath(
  options: ts.CompilerOptions,
): (sourceFile: ts.SourceFile) => string {
  return (sourceFile: ts.SourceFile) =>
    options.rootDir
      ? sourceFile.fileName.replace(options.rootDir + '/', '')
      : sourceFile.fileName;
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
