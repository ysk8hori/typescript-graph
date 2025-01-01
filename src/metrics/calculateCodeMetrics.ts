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

interface Score {
  /** 計測した値の名前。 Maintainability Index など。 */
  name: string;
  /** 計測した値 */
  value: number;
}

export interface CodeMetrics {
  /** ファイル名や関数名など */
  name: string;
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
      const sourceCode = readFileSync(_source.fileName, 'utf-8');
      const source = ts.createSourceFile(
        _source.fileName,
        sourceCode,
        ts.ScriptTarget.ESNext,
        // parent を使うことがあるので true
        true,
        ts.ScriptKind.TS,
      );
      const cyclomaticComplexity = new CyclomaticComplexityForSourceCode(name);
      const semanticSyntaxVolume = new SemanticSyntaxVolumeForSourceCode(name);
      const cognitiveComplexity = new CognitiveComplexityForSourceCode(name);
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
    })
    .map(convert);
  data.forEach(d => console.table(JSON.stringify(d, null, '  ')));
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

function convert({
  semanticSyntaxVolume,
  cognitiveComplexity,
  cyclomaticComplexity,
}: ConvertProps): CodeMetrics {
  const maintainabilityIndex = Math.max(
    0,
    ((171 -
      5.2 * Math.log(semanticSyntaxVolume.score.volume) -
      0.23 * cyclomaticComplexity.score -
      16.2 * Math.log(semanticSyntaxVolume.score.lines)) *
      100) /
      171,
  );
  const maintainabilityIndex2 = Math.max(
    0,
    ((171 -
      5.2 * Math.log(semanticSyntaxVolume.score.volume) -
      0.23 * cognitiveComplexity.score -
      16.2 * Math.log(semanticSyntaxVolume.score.lines)) *
      100) /
      171,
  );
  return {
    name: cognitiveComplexity.name,
    scores: [
      {
        name: 'Maintainability Index',
        value: maintainabilityIndex,
      },
      {
        name: 'Cyclomatic Complexity',
        value: cyclomaticComplexity.score,
      },
      {
        name: 'Maintainability Index (with Cognitive Complexity)',
        value: maintainabilityIndex2,
      },
      {
        name: 'Cognitive Complexity',
        value: cognitiveComplexity.score,
      },
      {
        name: 'lines',
        value: semanticSyntaxVolume.score.lines,
      },
      {
        name: 'volume',
        value: semanticSyntaxVolume.score.volume,
      },
      {
        name: 'total operands',
        value: semanticSyntaxVolume.score.operandsTotal,
      },
      {
        name: 'unique operands',
        value: semanticSyntaxVolume.score.operandsUnique,
      },
      {
        name: 'total semantic syntax',
        value: semanticSyntaxVolume.score.semanticSyntaxTotal,
      },
      {
        name: 'unique semantic syntax',
        value: semanticSyntaxVolume.score.semanticSyntaxUnique,
      },
    ] as const,
    children: hoge(
      semanticSyntaxVolume.children,
      cyclomaticComplexity.children,
      cognitiveComplexity.children,
    )?.map(convert),
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
