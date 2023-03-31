import { danger, message, warn } from 'danger';
import { readFileSync } from 'fs';
import path from 'path';
import { createGraph } from './src/graph/createGraph';
import { curry, pipe } from '@ysk8hori/simple-functional-ts';
import { filterGraph } from './src/graph/filterGraph';
import { abstraction } from './src/graph/abstraction';
import { highlight } from './src/graph/highlight';
import { writeMarkdownFile } from './src/writeMarkdownFile';

//  なぜ変更したのかの説明を含めると、どんなPRも小さくはありません
if (danger.github.pr.body.length < 10) {
  warn('Please include a description of your PR changes.');
}

// 以下の *_files は src/index.ts のようなパス文字列になっている
const modified = danger.git.modified_files;
const created = danger.git.created_files;
const deleted = danger.git.deleted_files;

modified
  .concat(created)
  .concat(deleted)
  .forEach(file => {
    danger.git.diffForFile(file).then(diff => {
      if (diff?.before && diff.after && diff.before !== diff.after) {
        console.log(
          `The file ${diff.before} has been renamed to ${diff.after}`,
        );
      }
    });
  });

// .tsファイルの変更がある場合のみ Graph を生成する。コンパイル対象外の ts ファイルもあるかもしれないがわからないので気にしない
if ([modified, created, deleted].flat().some(file => /\.ts|\.tsx/.test(file))) {
  // 各 *_files から、抽象化してはいけないディレクトリのリストを作成する

  const noAbstractionDirs = [modified, created, deleted]
    .flat()
    .map(file => {
      const array = file.split('/');
      if (array.includes('node_modules')) {
        // node_modules より深いディレクトリ階層の情報は捨てる
        // node_modules 内の node の name はパッケージ名のようなものになっているのでそれで良い
        return 'node_modules';
      } else if (array.length === 1) {
        // トップレベルのファイルの場合
        return undefined;
      } else {
        // 末尾のファイル名は不要
        return path.join(...array.slice(0, array.length - 1));
      }
    })
    .filter(Boolean)
    .sort()
    // noAbstractionDirs の重複を除去する
    .reduce<string[]>((prev, current) => {
      if (!current) return prev;
      if (!prev.includes(current)) prev.push(current);
      return prev;
    }, []);

  // Graph を生成
  const { graph: fullGraph, meta } = createGraph(path.resolve('./'));

  // Graph の node から、抽象化して良いディレクトリのリストを作成する
  const abstractionTarget = fullGraph.nodes
    .map(node => path.dirname(node.path))
    .filter(path => path !== '.' && !path.includes('node_modules'))
    .filter(path => noAbstractionDirs.every(dir => dir !== path))
    .sort()
    // 重複を除去する
    .reduce<string[]>((prev, current) => {
      if (!current) return prev;
      if (!prev.includes(current)) prev.push(current);
      return prev;
    }, []);

  const graph = pipe(
    curry(filterGraph)([modified, created].flat())(['node_modules']),
    curry(abstraction)(abstractionTarget),
    curry(highlight)([modified, created].flat()),
  )(fullGraph);

  const fileName = './typescript-graph.md';
  writeMarkdownFile(fileName, graph, {
    rootDir: meta.rootDir,
    LR: true,
    highlight: [modified, created].flat(),
  }).then(() => {
    const graphString = readFileSync(fileName, 'utf8');
    message(graphString);

    // eslint-disable-next-line no-constant-condition
    if (false) {
      // gist にアップロードする場合
      danger.github.api.gists
        .create({
          description: 'typescript-graph',
          public: true,
          files: {
            'typescript-graph.md': {
              content: graphString,
            },
          },
        })
        .then(res => {
          if (!res.data.html_url) return;
          message(`[typescript-graph](${res.data.html_url})`);
        });
    }
  });
}
