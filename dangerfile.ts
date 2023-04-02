import { danger, warn, markdown } from 'danger';
import { readFileSync } from 'fs';
import path from 'path';
import { createGraph } from './src/graph/createGraph';
import { curry, pipe } from '@ysk8hori/simple-functional-ts';
import { filterGraph } from './src/graph/filterGraph';
import { abstraction } from './src/graph/abstraction';
import { writeMarkdownFile } from './src/writeMarkdownFile';
import { Graph, Meta } from './src/models';
import { execSync } from 'child_process';
import { updateChangeStatusFromDiff, mergeGraph } from './src/graph/utils';
import addStatus from './src/graph/addStatus';
import mermaidify from './src/mermaidify';

//  なぜ変更したのかの説明を含めると、どんなPRも小さくはありません
if (danger.github.pr.body.length < 10) {
  warn('Please include a description of your PR changes.');
}

async function makeGraph() {
  // .tsファイルの変更がある場合のみ Graph を生成する。コンパイル対象外の ts ファイルもあるかもしれないがわからないので気にしない
  if (
    ![
      // 以下の *_files は src/index.ts のようなパス文字列になっている
      danger.git.modified_files,
      danger.git.created_files,
      danger.git.deleted_files,
    ]
      .flat()
      .some(file => /\.ts|\.tsx/.test(file))
  ) {
    return;
  }

  const modified = danger.git.modified_files;
  const created = danger.git.created_files;
  const deleted = danger.git.deleted_files;

  const baseBranch = danger.github.pr.base.ref; // ベースブランチ名
  const featureBranch = danger.github.pr.head.ref; // フィーチャーブランチ名
  const repoOwner = danger.github.pr.base.repo.owner.login;
  const repoName = danger.github.pr.base.repo.name;

  // 各 *_files から、抽象化してはいけないディレクトリのリストを作成する
  const noAbstractionDirs = extractNoAbstractionDirs(
    [modified, created, deleted].flat(),
  );

  const renamePromise = danger.github.api.repos
    .compareCommitsWithBasehead({
      owner: repoOwner,
      repo: repoName,
      basehead: `${baseBranch}...${featureBranch}`,
    })
    .then(comparison =>
      comparison.data.files?.filter(file => file.status === 'renamed'),
    );

  const graphPromise = new Promise<{
    headGraph: Graph;
    baseGraph: Graph;
    meta: Meta;
  }>(resolve => {
    // head の Graph を生成
    const { graph: fullHeadGraph, meta } = createGraph(path.resolve('./'));
    // head には deleted 対象はない
    const headGraph = filterGraph(
      [modified, created].flat(),
      ['node_modules'],
      fullHeadGraph,
    );

    // base の Graph を生成
    execSync(`git fetch origin ${baseBranch}`);
    execSync(`git checkout ${baseBranch}`);
    const { graph: fullBaseGraph } = createGraph(path.resolve('./'));
    const baseGraph = filterGraph(
      [modified, created, deleted].flat(),
      ['node_modules'],
      fullBaseGraph,
    );
    resolve({ headGraph, baseGraph, meta });
  });

  const [renamed, { headGraph, baseGraph, meta }] = await Promise.all([
    renamePromise,
    graphPromise,
  ]);

  // ファイルの削除またはリネームがある場合は Graph を2つ表示する
  // eslint-disable-next-line no-constant-condition
  if (created.length !== 0 || (renamed && renamed.length !== 0)) {
    // 2つのグラフを表示する
    let tmpBaseGraph = abstraction(
      extractAbstractionTarget(
        baseGraph,
        extractNoAbstractionDirs(
          [
            created,
            deleted,
            modified,
            (renamed?.map(diff => diff.previous_filename).filter(Boolean) ??
              []) as string[],
          ].flat(),
        ),
      ),
      baseGraph,
    );
    tmpBaseGraph = addStatus({ modified, created, deleted }, tmpBaseGraph);
    // base の書き出し
    const baseLines: string[] = [];
    await mermaidify((arg: string) => baseLines.push(arg), tmpBaseGraph, {
      rootDir: meta.rootDir,
      LR: true,
    });

    let tmpHeadGraph = abstraction(
      extractAbstractionTarget(
        headGraph,
        extractNoAbstractionDirs(
          [
            created,
            deleted,
            modified,
            (renamed?.map(diff => diff.previous_filename).filter(Boolean) ??
              []) as string[],
          ].flat(),
        ),
      ),
      headGraph,
    );
    tmpHeadGraph = addStatus({ modified, created, deleted }, tmpHeadGraph);
    // head の書き出し
    const headLines: string[] = [];
    await mermaidify((arg: string) => headLines.push(arg), tmpHeadGraph, {
      rootDir: meta.rootDir,
      LR: true,
    });

    markdown(`
# TypeScript Graph - Diff

## Base Branch

\`\`\`mermaid
${baseLines.join('\n')}
\`\`\`

## Head Branch

\`\`\`mermaid
${headLines.join('\n')}
\`\`\`

`);
  } else {
    // base と head のグラフをマージする
    updateChangeStatusFromDiff(baseGraph, headGraph);
    const mergedGraph = mergeGraph(headGraph, baseGraph);

    // rename の Relation を追加する
    if (renamed) {
      renamed.forEach(file => {
        const from = file.previous_filename;
        const to = file.filename;
        if (!from || !to) return;
        const fromNode = mergedGraph.nodes.find(node => node.path === from);
        const toNode = mergedGraph.nodes.find(node => node.path === to);
        if (!fromNode || !toNode) return;
        mergedGraph.relations.push({
          from: fromNode,
          to: toNode,
          kind: 'rename_to',
        });
      });
    }

    const graph = abstraction(
      extractAbstractionTarget(
        mergedGraph,
        extractNoAbstractionDirs(
          [
            created,
            deleted,
            modified,
            (renamed?.map(diff => diff.previous_filename).filter(Boolean) ??
              []) as string[],
          ].flat(),
        ),
      ),
      mergedGraph,
    );

    const mermaidLines: string[] = [];
    mermaidify((arg: string) => mermaidLines.push(arg), graph, {
      rootDir: meta.rootDir,
      LR: true,
    });

    markdown(`
  # TypeScript Graph - Diff

  \`\`\`mermaid
  ${mermaidLines.join('\n')}
  \`\`\`

  `);
  }

  // // rename 前のファイルは削除扱いとする
  // deleted.push(
  //   ...(renamed?.map(file => file.previous_filename ?? '').filter(Boolean) ??
  //     []),
  // );
  // // rename 後のファイルは新規作成扱いとする
  // created.push(
  //   ...(renamed?.map(file => file.filename ?? '').filter(Boolean) ?? []),
  // );
  // // rename 前後のファイルは変更ファイルから除外する
  // const modified = danger.git.modified_files.filter(
  //   file =>
  //     !renamed?.some(
  //       rename => rename.previous_filename === file || rename.filename === file,
  //     ),
  // );

  // // 各 *_files から、抽象化してはいけないディレクトリのリストを作成する
  // const noAbstractionDirs = extractNoAbstractionDirs(
  //   [modified, created, deleted].flat(),
  // );

  // // head の Graph を生成
  // const { graph: fullHeadGraph, meta } = createGraph(path.resolve('./'));
  // Graph の node から、抽象化して良いディレクトリのリストを作成する
  // const abstractionTargetForHead = extractAbstractionTarget(
  //   fullHeadGraph,
  //   noAbstractionDirs,
  // // );
  // // head には deleted 対象はないので deleted を空配列にしている
  // const headGraph = pipe(
  //   curry(filterGraph)([modified, created].flat())(['node_modules']),
  //   // curry(abstraction)(abstractionTargetForHead),
  //   // curry(addStatus)({ modified, created, deleted: [] }),
  // )(fullHeadGraph);

  // // head の書き出し
  // const headLines: string[] = [];
  // await mermaidify((arg: string) => headLines.push(arg), headGraph, {
  //   rootDir: meta.rootDir,
  //   LR: true,
  // });
  // const headFileName = './typescript-graph-head.md';
  // await writeMarkdownFile(headFileName, headGraph, {
  //   rootDir: meta.rootDir,
  //   LR: true,
  // });

  // base の Graph を生成
  // execSync(`git fetch origin ${baseBranch}`);
  // execSync(`git checkout ${baseBranch}`);
  // const { graph: fullBaseGraph } = createGraph(path.resolve('./'));

  // // Graph の node から、抽象化して良いディレクトリのリストを作成する
  // const abstractionTargetForBase = extractAbstractionTarget(
  //   fullBaseGraph,
  //   noAbstractionDirs,
  // );

  // const baseGraph = pipe(
  //   curry(filterGraph)([modified, created, deleted].flat())(['node_modules']),
  //   // curry(abstraction)(abstractionTargetForBase),
  //   // curry(addStatus)({ modified, created, deleted }),
  // )(fullBaseGraph);

  //   // base の書き出し
  //   const baseLines: string[] = [];
  //   await mermaidify((arg: string) => baseLines.push(arg), baseGraph, {
  //     rootDir: meta.rootDir,
  //     LR: true,
  //   });

  //   markdown(`
  // # TypeScript Graph - Diff

  // ## Base Branch

  // \`\`\`mermaid
  // ${baseLines.join('\n')}
  // \`\`\`

  // ## Head Branch

  // \`\`\`mermaid
  // ${headLines.join('\n')}
  // \`\`\`

  // `);

  // const baseFileName = './typescript-graph-base.md';
  // await writeMarkdownFile(baseFileName, baseGraph, {
  //   rootDir: meta.rootDir,
  //   LR: true,
  // });
  // // base の読み込み
  // const baseGraphString = readFileSync(baseFileName, 'utf8');
  // // base の投稿
  // markdown(`# Before`);
  // markdown(baseGraphString);

  // // head の読み込み
  // const headGraphString = readFileSync(headFileName, 'utf8');
  // // head の投稿
  // markdown(`# After`);
  // markdown(headGraphString);

  // // rename の Relation を追加する
  // if (renamed) {
  //   renamed.forEach(file => {
  //     const from = file.previous_filename;
  //     const to = file.filename;
  //     if (!from || !to) return;
  //     const fromNode = graph.nodes.find(node => node.path === from);
  //     const toNode = graph.nodes.find(node => node.path === to);
  //     if (!fromNode || !toNode) return;
  //     graph.relations.push({
  //       from: fromNode,
  //       to: toNode,
  //       kind: 'rename_to',
  //     });
  //   });
  // }

  // file 書き出しと投稿フェーズ

  // const fileName = './typescript-graph.md';
  // await writeMarkdownFile(fileName, graph, {
  //   rootDir: meta.rootDir,
  //   LR: true,
  // });
  // const graphString = readFileSync(fileName, 'utf8');
  // markdown(graphString);

  // eslint-disable-next-line no-constant-condition
  // if (false) {
  //   // gist にアップロードする場合
  //   await danger.github.api.gists
  //     .create({
  //       description: 'typescript-graph',
  //       public: true,
  //       files: {
  //         'typescript-graph.md': {
  //           content: graphString,
  //         },
  //       },
  //     })
  //     .then(res => {
  //       if (!res.data.html_url) return;
  //       message(`[typescript-graph](${res.data.html_url})`);
  //     });
  // }
}
makeGraph();

/** （本PRで）変更のあったファイルのパスから、抽象化してはいけないディレクトリのリストを作成する */
function extractNoAbstractionDirs(filePaths: string[]) {
  return (
    filePaths
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
      }, [])
  );
}

/** グラフと、抽象化してはいけないファイルのパスから、抽象化して良いディレクトリのパスを取得する */
function extractAbstractionTarget(
  fullGraph: Graph,
  noAbstractionDirs: string[],
): string[] {
  return (
    fullGraph.nodes
      .map(node => path.dirname(node.path))
      .filter(path => path !== '.' && !path.includes('node_modules'))
      .filter(path => noAbstractionDirs.every(dir => dir !== path))
      .sort()
      // 重複を除去する
      .reduce<string[]>((prev, current) => {
        if (!current) return prev;
        if (!prev.includes(current)) prev.push(current);
        return prev;
      }, [])
  );
}
