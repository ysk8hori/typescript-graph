import { test, expect } from 'vitest';
import { setupConfig, getConfig } from '.';

test('appConfigとrcConfigをマージする', () => {
  setupConfig('src/setting/config/rcSamples/valid.tsgrc.json');
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
  });
});
test('rcFilePathのファイルが不正な場合は appConfig のみ返る', () => {
  setupConfig('src/setting/config/rcSamples/invalid.tsgrc.json');
  expect(getConfig()).toEqual({
    reservedMermaidKeywords: [
      ['/graph/', '/_graph_/'],
      ['style', 'style_'],
      ['graph', 'graph_'],
      ['class', 'class_'],
      ['end', 'end_'],
    ],
    exclude: [],
  });
});
