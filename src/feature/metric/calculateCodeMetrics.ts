import path from 'path';
import ts from 'typescript';
import { allPass, piped } from 'remeda';
import { OptionValues } from '../../setting/model';
import { getMetricsRawData } from './getMetricsRawData';
import {
  CodeMetrics,
  convertRawToCodeMetrics,
} from './convertRawToCodeMetrics';

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

export function sortMetrics(list: CodeMetrics[]) {
  list.sort(
    (a, b) =>
      (a.scores.find(s => s.name === 'Maintainability Index')?.value ?? 0) -
      (b.scores.find(s => s.name === 'Maintainability Index')?.value ?? 0),
  );
  list.forEach(m => m.children && sortMetrics(m.children));
}

export type FlattenMaterics = { fileName: string } & Pick<
  CodeMetrics,
  'scope' | 'name' | 'scores'
>;
export function flatMetrics<T extends CodeMetrics | CodeMetrics[]>(
  metrics: T,
  fileName?: string,
): FlattenMaterics[] {
  if (Array.isArray(metrics)) {
    return metrics.map(m => flatMetrics(m)).flat();
  }
  const children =
    metrics.children?.map(c =>
      fileName
        ? flatMetrics({ ...c, name: `${metrics.name}.${c.name}` }, fileName) // クラスを想定。汎用的でない処理なので注意。
        : flatMetrics(c, metrics.name),
    ) ?? [];
  return [
    {
      // CodeMetrics を拡張した CodeMetricsWithDiff にも対応するためスプレッド構文でもマージすること
      ...(metrics as CodeMetrics), // CodeMetrics[] の可能性は排除しているが as を使わないと型エラーとなる
      fileName: fileName ?? metrics.name,
      name: fileName ? metrics.name : '-',
    },
    ...children,
  ].flat();
}
