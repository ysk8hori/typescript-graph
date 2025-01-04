import path from 'path';
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
import { MetricsScope } from './Metrics';
import { MetricsScoreState } from './metricsModels';
import { OptionValues } from '../../cli/model';

export interface Score {
  /** 計測した値の名前。 Maintainability Index など。 */
  name: string;
  /** 計測した値 */
  value: number;
  /** 判定結果 */
  state: MetricsScoreState;
  /** 値が高いほど良いか低いほど良いか */
  betterDirection: 'higher' | 'lower' | 'none';
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
      const name = getFilePath(options)(_source);
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
        betterDirection: 'higher',
      },
      {
        name: 'Cyclomatic Complexity',
        value: cyclomaticComplexity.score,
        state: 'normal',
        betterDirection: 'lower',
      },
      {
        name: 'Cognitive Complexity',
        value: cognitiveComplexity.score,
        state: 'normal',
        betterDirection: 'lower',
      },
      {
        name: 'lines',
        value: semanticSyntaxVolume.score.lines,
        state: 'normal',
        betterDirection: 'lower',
      },
      {
        name: 'semantic syntax volume',
        value: semanticSyntaxVolume.score.volume,
        state: 'normal',
        betterDirection: 'lower',
      },
      {
        name: 'total operands',
        value: semanticSyntaxVolume.score.operandsTotal,
        state: 'normal',
        betterDirection: 'lower',
      },
      {
        name: 'unique operands',
        value: semanticSyntaxVolume.score.operandsUnique,
        state: 'normal',
        betterDirection: 'lower',
      },
      {
        name: 'total semantic syntax',
        value: semanticSyntaxVolume.score.semanticSyntaxTotal,
        state: 'normal',
        betterDirection: 'lower',
      },
      {
        name: 'unique semantic syntax',
        value: semanticSyntaxVolume.score.semanticSyntaxUnique,
        state: 'normal',
        betterDirection: 'lower',
      },
    ] as const,
    children: zipHierarchicalMetris(
      semanticSyntaxVolume.children,
      cyclomaticComplexity.children,
      cognitiveComplexity.children,
    )?.map(convertRowToCodeMetrics),
  };
}

function zipHierarchicalMetris(
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

function getMIState(score: number): MetricsScoreState {
  if (score < 10) return 'critical';
  if (score < 20) return 'alert';
  return 'normal';
}

function getClassMIState(score: number): MetricsScoreState {
  if (score === 0) return 'critical';
  if (score < 10) return 'alert';
  return 'normal';
}

function getFileMIState(score: number): MetricsScoreState {
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
      // CodeMetrics を拡張した CodeMetricsWithDiff にも対応するためスプレッド構文でもマージすること
      ...(metrics as CodeMetrics), // CodeMetrics[] の可能性は排除しているが as を使わないと型エラーとなる
      fileName: fileName ?? metrics.name,
      name: fileName ? metrics.name : '-',
    },
    ...children,
  ].flat();
}
