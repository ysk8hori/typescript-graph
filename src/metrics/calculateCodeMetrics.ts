import path from 'path';
import { OptionValues } from '../models';
import ts from 'typescript';
import { allPass, pipe, piped, zipWith } from 'remeda';
import AstTraverser from './AstTraverser';
import CognitiveComplexityForSourceCode from './CognitiveComplexityForSourceCode';
import CyclomaticComplexityForSourceCode from './CyclomaticComplexityForSourceCode';
import SemanticSyntaxVolumeForSourceCode from './SemanticSyntaxVolumeForSourceCode';
import { CognitiveComplexityMetrics } from './CognitiveComplexity';
import { SemanticSyntaxVolumeMetrics } from './SemanticSyntaxVolume';
import { readFileSync } from 'fs';
import { CyclomaticComplexityMetrics } from './CyclomaticComplexity';
import Metrics, { MetricsScope } from './Metrics';

interface Score {
  /** 計測した値の名前。 Maintainability Index など。 */
  name: string;
  /** 計測した値 */
  value: number;
  /** 判定結果 */
  state: 'normal' | 'alert' | 'critical';
}

export interface CodeMetrics {
  /** ファイル名や関数名など */
  name: string;
  scope: MetricsScope;
  scores: Score[];
  children?: CodeMetrics[];
}

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
    .map(_source => {
      const name = pipe(_source, getFilePath(options), removeSlash);
      return getMetricsRowData(name);
    })
    .map(convertRowToCodeMetrics);
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

interface ConvertProps {
  semanticSyntaxVolume: SemanticSyntaxVolumeMetrics;
  cyclomaticComplexity: CyclomaticComplexityMetrics;
  cognitiveComplexity: CognitiveComplexityMetrics;
}

export function getMetricsRowData(path: string) {
  const sourceCode = readFileSync(path, 'utf-8');
  const source = ts.createSourceFile(
    path,
    sourceCode,
    ts.ScriptTarget.ESNext,
    // parent を使うことがあるので true
    true,
    ts.ScriptKind.TS,
  );
  const cyclomaticComplexity = new CyclomaticComplexityForSourceCode(path);
  const semanticSyntaxVolume = new SemanticSyntaxVolumeForSourceCode(path);
  const cognitiveComplexity = new CognitiveComplexityForSourceCode(path);
  const astTraverser = new AstTraverser(source, [
    semanticSyntaxVolume,
    cyclomaticComplexity,
    cognitiveComplexity,
  ]);
  astTraverser.traverse();
  return {
    semanticSyntaxVolume: semanticSyntaxVolume.metrics,
    cyclomaticComplexity: cyclomaticComplexity.metrics,
    cognitiveComplexity: cognitiveComplexity.metrics,
  };
}

export function convertRowToCodeMetrics({
  semanticSyntaxVolume,
  cognitiveComplexity,
  cyclomaticComplexity,
}: ConvertProps): CodeMetrics {
  const maintainabilityIndex = Math.max(
    0,
    ((171 -
      5.2 * Math.log(semanticSyntaxVolume.score.volume) -
      0.115 * cyclomaticComplexity.score -
      0.115 * cognitiveComplexity.score -
      16.2 * Math.log(semanticSyntaxVolume.score.lines)) *
      100) /
      171,
  );
  const scope = cognitiveComplexity.scope;
  return {
    name: cognitiveComplexity.name,
    scope,
    scores: [
      {
        name: 'Maintainability Index',
        value: maintainabilityIndex,
        state: getMarker(scope)(maintainabilityIndex),
      },
      {
        name: 'Cyclomatic Complexity',
        value: cyclomaticComplexity.score,
        state: 'normal',
      },
      {
        name: 'Cognitive Complexity',
        value: cognitiveComplexity.score,
        state: 'normal',
      },
      {
        name: 'lines',
        value: semanticSyntaxVolume.score.lines,
        state: 'normal',
      },
      {
        name: 'semantic syntax volume',
        value: semanticSyntaxVolume.score.volume,
        state: 'normal',
      },
      {
        name: 'total operands',
        value: semanticSyntaxVolume.score.operandsTotal,
        state: 'normal',
      },
      {
        name: 'unique operands',
        value: semanticSyntaxVolume.score.operandsUnique,
        state: 'normal',
      },
      {
        name: 'total semantic syntax',
        value: semanticSyntaxVolume.score.semanticSyntaxTotal,
        state: 'normal',
      },
      {
        name: 'unique semantic syntax',
        value: semanticSyntaxVolume.score.semanticSyntaxUnique,
        state: 'normal',
      },
    ] as const,
    children: hoge(
      semanticSyntaxVolume.children,
      cyclomaticComplexity.children,
      cognitiveComplexity.children,
    )?.map(convertRowToCodeMetrics),
  };
}

function hoge(
  semanticSyntaxVolumeChildren?: SemanticSyntaxVolumeMetrics[],
  cyclomaticComplexityChildren?: CyclomaticComplexityMetrics[],
  cognitiveComplexityChildren?: CognitiveComplexityMetrics[],
): ConvertProps[] | undefined {
  return semanticSyntaxVolumeChildren &&
    cyclomaticComplexityChildren &&
    cognitiveComplexityChildren
    ? zipWith(
        (
          cognitiveComplexity: CognitiveComplexityMetrics,
          doubleProp: Pick<
            ConvertProps,
            'semanticSyntaxVolume' | 'cyclomaticComplexity'
          >,
        ) => {
          return {
            cognitiveComplexity,
            ...doubleProp,
          } satisfies ConvertProps;
        },
      )(
        cognitiveComplexityChildren,
        zipWith(
          (
            semanticSyntaxVolume: SemanticSyntaxVolumeMetrics,
            cyclomaticComplexity: CyclomaticComplexityMetrics,
          ) => {
            return {
              semanticSyntaxVolume,
              cyclomaticComplexity,
            } satisfies Pick<
              ConvertProps,
              'semanticSyntaxVolume' | 'cyclomaticComplexity'
            >;
          },
        )(semanticSyntaxVolumeChildren, cyclomaticComplexityChildren),
      )
    : undefined;
}

function getMarker(scope: MetricsScope) {
  switch (scope) {
    case 'class':
      return getClassMIState;
    case 'file':
      return getFileMIState;
    default:
      return getMIState;
  }
}

function getMIState(score: number): Score['state'] {
  if (score < 10) return 'critical';
  if (score < 20) return 'alert';
  return 'normal';
}

function getClassMIState(score: number): Score['state'] {
  if (score === 0) return 'critical';
  if (score < 10) return 'alert';
  return 'normal';
}

function getFileMIState(score: number): Score['state'] {
  if (score === 0) return 'critical';
  if (score < 10) return 'alert';
  return 'normal';
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
      fileName: fileName ?? metrics.name,
      scope: metrics.scope,
      name: fileName ? metrics.name : '-',
      scores: metrics.scores,
    },
    ...children,
  ].flat();
}
