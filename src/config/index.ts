import { z } from 'zod';
import tsgConfig from './config.json';

const tsgConfigScheme = z.object({
  reservedMermaidKeywords: z.array(z.tuple([z.string(), z.string()])),
});

/** typescript-graph 内部で使用するコンフィグ */
export type TsgConfigScheme = z.infer<typeof tsgConfigScheme>;

let _config: TsgConfigScheme | undefined = undefined;

export function config() {
  if (_config) return _config;
  _config = tsgConfigScheme.parse(tsgConfig);
  return _config;
}
