import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { z } from 'zod';
import tsgConfig from './config.json';

const tsgConfigScheme = z.object({
  reservedMermaidKeywords: z.array(z.tuple([z.string(), z.string()])),
  exclude: z.array(z.string()).optional(),
});
const tsgRcScheme = tsgConfigScheme.deepPartial();

/** typescript-graph 内部で使用するコンフィグ */
export type TsgConfigScheme = z.infer<typeof tsgConfigScheme>;
/** typescript-graph ユーザーが指定するランタイムコンフィグ */
export type TsgRcScheme = z.infer<typeof tsgRcScheme>;

let mergedConfig: TsgConfigScheme | undefined = undefined;

export function readRuntimeConfig(
  filePath: string = path.join(process.cwd(), '.tsgrc.json'),
): TsgRcScheme {
  // ファイルがない場合は空オブジェクトを返す
  if (!existsSync(filePath)) return {};
  try {
    return tsgRcScheme.parse(JSON.parse(readFileSync(filePath, 'utf-8')));
  } catch (e) {
    // ファイルがJSONでない場合はその旨のエラーログを吐き、空オブジェクトを返す
    console.error(e);
    return {};
  }
}

function mergeConfig(
  config: TsgConfigScheme,
  rc: TsgRcScheme,
): TsgConfigScheme {
  return {
    ...config,
    ...rc,
    reservedMermaidKeywords: [
      ...config.reservedMermaidKeywords,
      ...(rc.reservedMermaidKeywords ?? []),
    ],
    exclude: [...(config.exclude ?? []), ...(rc.exclude ?? [])],
  };
}

export function setupConfig(
  rcFilePath: string = path.join(process.cwd(), '.tsgrc.json'),
) {
  mergedConfig = mergeConfig(
    tsgConfigScheme.parse(tsgConfig),
    readRuntimeConfig(rcFilePath),
  );
}

/** 通常は current working directory の `.tsgrc.json` を読み込みます。その他のファイルを読み込みたい場合は setupConfig に current working directory からの相対パスを指定してください。 */
export function getConfig(): TsgConfigScheme {
  if (!mergedConfig) setupConfig();
  if (!mergedConfig) throw new Error('getConfig() called before setupConfig()');
  return mergedConfig;
}
