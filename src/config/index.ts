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

let _config: TsgConfigScheme | undefined = undefined;

export function config() {
  if (_config) return _config;
  _config = tsgConfigScheme.parse(tsgConfig);
  return _config;
}

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
