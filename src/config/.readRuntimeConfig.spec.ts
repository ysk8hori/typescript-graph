import { expect, test } from 'vitest';
import { readRuntimeConfig } from '.';
import path from 'path';

test('ファイルが存在しない場合は{}を返す', () => {
  expect(
    readRuntimeConfig(path.join(process.cwd(), './src/conf/dummy')),
  ).toEqual({});
});
test('JSONでない場合は{}を返す', () => {
  expect(
    readRuntimeConfig(
      path.join(process.cwd(), './src/config/rcSamples/notJson.tsgrc.text'),
    ),
  ).toEqual({});
});
test('不正なスキーマの場合は{}を返す', () => {
  expect(
    readRuntimeConfig(
      path.join(process.cwd(), './src/config/rcSamples/invalid.tsgrc.json'),
    ),
  ).toEqual({});
});
test('正しいスキーマの場合はそれを返す', () => {
  expect(
    readRuntimeConfig(
      path.join(process.cwd(), './src/config/rcSamples/valid.tsgrc.json'),
    ),
  ).toEqual({
    reservedMermaidKeywords: [['/graph/', '/_graph_/']],
  });
});
