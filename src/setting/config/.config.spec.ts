import { beforeAll, expect, test } from 'vitest';
import type { TsgConfigScheme } from '.';
import { getConfig, setupConfig } from '.';

beforeAll(() => setupConfig('./src/setting/config/rcSamples/valid.tsgrc.json'));

test('getConfig', () => {
  expect(getConfig()).toEqual({
    reservedMermaidKeywords: [
      ['/graph/', '/_graph_/'],
      ['style', 'style_'],
      ['graph', 'graph_'],
      ['class', 'class_'],
      ['end', 'end_'],
      ['foo', 'foo_'],
    ],
    exclude: ['node_modules'],
  } satisfies TsgConfigScheme);
});
