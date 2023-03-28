import { danger, message, warn } from 'danger';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import path from 'path';
import { createGraph } from './src/graph/createGraph';

//  なぜ変更したのかの説明を含めると、どんなPRも小さくはありません
if (danger.github.pr.body.length < 10) {
  warn('Please include a description of your PR changes.');
}

// 以下の *_files は src/index.ts のようなパス文字列になっている
const modified = danger.git.modified_files;
const created = danger.git.created_files;
const deleted = danger.git.deleted_files;

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
  const { graph } = createGraph(path.resolve('./'));

  // Graph の node から、抽象化して良いディレクトリのリストを作成する
  const abstractionTargetDirs = graph.nodes
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

  const abstractionFlag =
    abstractionTargetDirs.length > 0
      ? `--abstraction ${abstractionTargetDirs.join(' ')}`
      : '';

  const fileName = './typescript-graph.md';
  execSync(
    `npx tsg --md "${fileName}" --LR --include ${modified.join(
      ' ',
    )} ${created.join(' ')} ${deleted.join(
      ' ',
    )} --exclude node_modules --highlight ${modified.join(' ')} ${created.join(
      ' ',
    )} ${deleted.join(' ')} ${abstractionFlag}`,
  );
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
}
