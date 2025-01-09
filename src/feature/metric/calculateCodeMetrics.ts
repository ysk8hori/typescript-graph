import path from 'path';
import ts from 'typescript';
import { allPass, piped } from 'remeda';
import { OptionValues } from '../../setting/model';
import { getMetricsRawData } from './getMetricsRawData';
import { convertRawToCodeMetrics } from './convertRawToCodeMetrics';
import { CodeMetrics, MetricsScope } from './metricsModels';
import { Tree } from '../../utils/Tree';

export function calculateCodeMetrics(
  opt: Pick<OptionValues, 'exclude' | 'dir' | 'tsconfig' | 'include'>,
): CodeMetrics[] {
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
  const isMatchSomeInclude = opt.include
    ? bindWords_isFileNameMatchSomeWords(opt.include)
    : () => true;

  const { options, fileNames: fullFilePaths } = ts.parseJsonConfigFileContent(
    config,
    ts.sys,
    rootDir,
  );
  options.rootDir = rootDir;
  const program = ts.createProgram(fullFilePaths, options);
  const data = program
    .getSourceFiles()
    .filter(sourceFile => !sourceFile.fileName.includes('node_modules')) // node_modules 配下のファイルは除外
    .filter(
      piped(
        getFilePath(options),
        removeSlash,
        allPass([isNotMatchSomeExclude, isMatchSomeInclude]),
      ),
    )
    .map(
      piped(getFilePath(options), getMetricsRawData, convertRawToCodeMetrics),
    );
  return data;
}

function getFilePath(
  options: ts.CompilerOptions,
): (sourceFile: ts.SourceFile) => string {
  return (sourceFile: ts.SourceFile) =>
    options.rootDir
      ? sourceFile.fileName.replace(options.rootDir + '/', '')
      : sourceFile.fileName;
}

function removeSlash(pathName: string): string {
  return pathName.startsWith('/') ? pathName.replace('/', '') : pathName;
}

export function sortMetrics(list: Tree<Pick<CodeMetrics, 'scores'>>[]) {
  list.sort(
    (a, b) =>
      (a.scores.find(s => s.name === 'Maintainability Index')?.value ?? 0) -
      (b.scores.find(s => s.name === 'Maintainability Index')?.value ?? 0),
  );
  list.forEach(m => m.children && sortMetrics(m.children));
}
export function sortMetrics2(
  list: Tree<Pick<CodeMetrics, 'scores'>>[],
): Tree<Pick<CodeMetrics, 'scores'>>[] {
  const newList = list.toSorted(
    (a, b) =>
      (a.scores.find(s => s.name === 'Maintainability Index')?.value ?? 0) -
      (b.scores.find(s => s.name === 'Maintainability Index')?.value ?? 0),
  );
  newList.map(m => {
    if (m.children) {
      m.children = sortMetrics2(m.children);
    }
    return m;
  });
  return newList;
}

/**
 * 各ノードの名前を更新する。
 *
 * - ノードのスコープがファイルの場合は `-` に変更
 * - クラスの子ノードの場合は `クラス名.メソッド名` に変更
 * - それ以外はそのまま
 */
export function updateMetricsName<
  T extends Tree<{
    name: string;
    scope: MetricsScope;
  }>,
>(metrics: T, classname?: string): T {
  return {
    // T を拡張した型にも対応するためスプレッド構文でもマージすること
    ...metrics,
    name: classname
      ? `${classname}.${metrics.name}`
      : metrics.scope === 'file'
        ? '-'
        : metrics.name,
    children: metrics.children?.map(c =>
      updateMetricsName(
        c,
        metrics.scope === 'class' ? metrics.name : undefined,
      ),
    ),
  };
}
