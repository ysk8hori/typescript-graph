# AI向け構造化データ出力機能の実装 ✅ 完了

## 目的
TypeScript Graphを AI により使いやすくするため、JSON 形式での構造化データ出力機能を追加する。

## 実装方針

### 1. 出力方式 ✅
- **コマンドライン出力（stdout）** を採用
- ファイル出力ではなく、パイプライン処理やリアルタイム処理に適した方式
- 既存の markdown ファイル出力と併用可能

### 2. 新しいオプション ✅
- `--json`: JSON 形式でグラフデータと メトリクス を stdout に出力
- ~~`--yaml`: YAML 形式でグラフデータと メトリクス を stdout に出力~~ (削除：JSON のみに絞った)

### 3. 使用例 ✅
```bash
# JSON出力
tsg --json

# メトリクス付きJSON出力
tsg --json --metrics

# AIツールとの連携
tsg --json | claude-analysis
tsg --json | jq '.graph.nodes | length'

# ファイル保存したい場合
tsg --json > analysis.json

# 既存機能との併用
tsg --json --md graph.md  # JSON出力 + Markdownファイル生成
```

### 4. 出力データ構造 ✅
```typescript
interface StructuredOutput {
  metadata: {
    command: string;
    timestamp: string;
    version: string;
  };
  graph: {
    nodes: Node[];
    relations: Relation[];
  };
  metrics?: CodeMetrics[];  // --metrics オプション時のみ
  instability?: InstabilityData[];  // --measure-instability オプション時のみ
}
```

## 実装箇所

### 1. CLI オプション追加 ✅
- **ファイル**: `src/cli/entry.ts`
- **追加**: `--json` オプション

### 2. 型定義更新 ✅
- **ファイル**: `src/setting/model.ts`
- **追加**: `OptionValues` インターフェースに `json?` フィールド

### 3. 出力処理実装 ✅
- **ファイル**: `src/usecase/generateTsg/writeStructuredData.ts` (新規作成)
- **機能**: JSON 形式での stdout 出力

### 4. メイン処理統合 ✅
- **ファイル**: `src/usecase/generateTsg/index.ts`
- **機能**: 既存の Markdown 出力処理と構造化データ出力の統合

## 技術的詳細

### JSON出力実装 ✅
- `JSON.stringify()` を使用してデータをシリアライズ
- `console.log()` で stdout に出力

### データ変換 ✅
- 既存の `Graph` データと `CodeMetrics` データを活用
- AI が解析しやすい構造に調整

## テスト結果 ✅
1. ✅ 基本的な JSON 出力動作確認
2. ✅ 既存機能（--md）との併用テスト
3. ✅ メトリクス付きJSON出力テスト
4. ✅ パイプライン処理テスト（jq との連携確認）

## 最終的な実装内容
- `--json` オプションによる構造化データのstdout出力
- メタデータ（コマンド、タイムスタンプ、バージョン）の自動付与
- メトリクスと不安定性データの条件付き出力
- 既存のMarkdown出力との併用サポート
- AIツールとのパイプライン処理対応

## 使用可能なコマンド例
```bash
# 基本JSON出力
node dist/src/cli/entry.js --json src/cli

# メトリクス付きJSON出力
node dist/src/cli/entry.js --json --metrics src/cli

# JSON出力とMarkdownファイル生成の併用
node dist/src/cli/entry.js --json --md analysis.md src/cli

# AIツールとの連携例
node dist/src/cli/entry.js --json src/cli | jq '.graph.nodes | length'
```