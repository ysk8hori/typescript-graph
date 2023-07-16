import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { z } from 'zod';
import tsgConfig from './config.json';

const tsgConfigScheme = z.object({
  reservedMermaidKeywords: z.array(z.tuple([z.string(), z.string()])),
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
  if (!existsSync(filePath)) return {};
  try {
    return tsgRcScheme.parse(JSON.parse(readFileSync(filePath, 'utf-8')));
  } catch (e) {
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

export function config(): TsgConfigScheme {
  if (!mergedConfig) throw new Error('config() called before setupConfig()');
  return mergedConfig;
}
