# TypeScript graph

A CLI to visualize the dependencies between files in the TypeScript codebase.

For example, the following command in the base directory of https://github.com/ysk8hori/numberplace will produce the following results:

```bash
tsg --include src/components/atoms/ConfigMenu --exclude test stories node_modules
```

```mermaid
flowchart
    classDef dir fill:#0000,stroke:#999
    subgraph src["src"]
        src/atoms.ts["atoms.ts"]
        subgraph src/components/atoms["/components/atoms"]
            src/components/atoms/Button.tsx["Button.tsx"]
            subgraph src/components/atoms/ConfigMenu["/ConfigMenu"]
                src/components/atoms/ConfigMenu/index.tsx["index.tsx"]
                subgraph src/components/atoms/ConfigMenu/MenuStack["/MenuStack"]
                    src/components/atoms/ConfigMenu/MenuStack/MenuStack.tsx["MenuStack.tsx"]
                    src/components/atoms/ConfigMenu/MenuStack/index.ts["index.ts"]
                end
                subgraph src/components/atoms/ConfigMenu/MenuButton["/MenuButton"]
                    src/components/atoms/ConfigMenu/MenuButton/MenuButton.tsx["MenuButton.tsx"]
                    src/components/atoms/ConfigMenu/MenuButton/index.ts["index.ts"]
                end
            end
        end
        subgraph src/pages["/pages"]
            subgraph src/pages/GameContainer["/GameContainer"]
                src/pages/GameContainer/GameContainer.tsx["GameContainer.tsx"]
            end
            subgraph src/pages/GenerateGameContainer["/GenerateGameContainer"]
                src/pages/GenerateGameContainer/GenerateGameContainer.tsx["GenerateGameContainer.tsx"]
            end
            subgraph src/pages/StartMenu["/StartMenu"]
                src/pages/StartMenu/StartMenu.tsx["StartMenu.tsx"]
            end
        end
    end
    src/components/atoms/ConfigMenu/MenuStack/MenuStack.tsx-->src/atoms.ts
    src/components/atoms/ConfigMenu/MenuStack/MenuStack.tsx-->src/components/atoms/Button.tsx
    src/components/atoms/ConfigMenu/MenuStack/index.ts-->src/components/atoms/ConfigMenu/MenuStack/MenuStack.tsx
    src/components/atoms/ConfigMenu/MenuButton/MenuButton.tsx-->src/components/atoms/Button.tsx
    src/components/atoms/ConfigMenu/index.tsx-->src/components/atoms/ConfigMenu/MenuStack/index.ts
    src/components/atoms/ConfigMenu/index.tsx-->src/components/atoms/ConfigMenu/MenuButton/MenuButton.tsx
    src/pages/GameContainer/GameContainer.tsx-->src/components/atoms/ConfigMenu/index.tsx
    src/pages/GenerateGameContainer/GenerateGameContainer.tsx-->src/components/atoms/ConfigMenu/index.tsx
    src/pages/StartMenu/StartMenu.tsx-->src/components/atoms/ConfigMenu/index.tsx
    src/components/atoms/ConfigMenu/MenuButton/index.ts-->src/components/atoms/ConfigMenu/MenuButton/MenuButton.tsx
```

## Installation

```bash
npm install --save-dev @ysk8hori/typescript-graph
```

or global install.

## Options

Run the `tsg -h` for help

```Options:
  -V, --version            output the version number
  --md <char>              Specify the name of the markdown file to be output. Default is typescript-graph.md.
  --mermaid-link           Generates a link on node to open that file in VSCode.
  -d, --dir <char>         Specify the TypeScript code base to be analyzed. if tsconfig.json is not found, specify the directory where tsconfig.json is located.
  --include <char...>      Specify paths and file names to be included in the graph
  --exclude <char...>      Specify the paths and file names to be excluded from the graph
  --abstraction <char...>  Specify the path to abstract
  --LR                     Specify Flowchart orientation Left-to-Right
  --TB                     Specify Flowchart orientation Top-to-Bottom
  --neo4j                  output to neo4j on localhost:7687
  --clear-db               clear neo4j database before output
  -h, --help               display help for command
```

## usage

tsg コマンドを、解析したいプロジェクトの配下で実行してください。

```bash
tsg
```

```mermaid
flowchart
    classDef dir fill:#0000,stroke:#999
    subgraph src["src"]
        src/utils.ts["utils.ts"]
        src/config.ts["config.ts"]
        src/main.ts["main.ts"]
        subgraph src/includeFiles["/includeFiles"]
            src/includeFiles/b.ts["b.ts"]
            src/includeFiles/c.ts["c.ts"]
            src/includeFiles/a.ts["a.ts"]
            subgraph src/includeFiles/children["/children"]
                src/includeFiles/children/childA.ts["childA.ts"]
            end
            subgraph src/includeFiles/excludeFiles["/excludeFiles"]
                src/includeFiles/excludeFiles/g.ts["g.ts"]
                src/includeFiles/excludeFiles/i.ts["i.ts"]
                src/includeFiles/excludeFiles/h.ts["h.ts"]
            end
            subgraph src/includeFiles/abstractions["/abstractions"]
                src/includeFiles/abstractions/j.ts["j.ts"]
                src/includeFiles/abstractions/l.ts["l.ts"]
                src/includeFiles/abstractions/k.ts["k.ts"]
                subgraph src/includeFiles/abstractions/children["/children"]
                    src/includeFiles/abstractions/children/childA.ts["childA.ts"]
                end
            end
        end
        subgraph src/otherFiles["/otherFiles"]
            src/otherFiles/d.ts["d.ts"]
            src/otherFiles/f.ts["f.ts"]
            src/otherFiles/e.ts["e.ts"]
            subgraph src/otherFiles/children["/children"]
                src/otherFiles/children/childA.ts["childA.ts"]
            end
        end
    end
    src/includeFiles/b.ts-->src/utils.ts
    src/includeFiles/b.ts-->src/config.ts
    src/includeFiles/c.ts-->src/utils.ts
    src/includeFiles/c.ts-->src/includeFiles/b.ts
    src/config.ts-->src/utils.ts
    src/config.ts-->src/includeFiles/c.ts
    src/includeFiles/children/childA.ts-->src/utils.ts
    src/includeFiles/excludeFiles/g.ts-->src/includeFiles/children/childA.ts
    src/includeFiles/excludeFiles/g.ts-->src/utils.ts
    src/includeFiles/excludeFiles/i.ts-->src/utils.ts
    src/includeFiles/excludeFiles/h.ts-->src/includeFiles/excludeFiles/i.ts
    src/includeFiles/excludeFiles/h.ts-->src/utils.ts
    src/includeFiles/excludeFiles/h.ts-->src/config.ts
    src/includeFiles/a.ts-->src/includeFiles/children/childA.ts
    src/includeFiles/a.ts-->src/includeFiles/excludeFiles/g.ts
    src/includeFiles/a.ts-->src/includeFiles/excludeFiles/h.ts
    src/includeFiles/a.ts-->src/includeFiles/excludeFiles/i.ts
    src/includeFiles/a.ts-->src/utils.ts
    src/otherFiles/children/childA.ts-->src/utils.ts
    src/otherFiles/d.ts-->src/otherFiles/children/childA.ts
    src/otherFiles/d.ts-->src/utils.ts
    src/otherFiles/f.ts-->src/utils.ts
    src/otherFiles/e.ts-->src/otherFiles/f.ts
    src/otherFiles/e.ts-->src/utils.ts
    src/otherFiles/e.ts-->src/config.ts
    src/includeFiles/abstractions/j.ts-->src/utils.ts
    src/includeFiles/abstractions/j.ts-->src/includeFiles/abstractions/children/childA.ts
    src/includeFiles/abstractions/l.ts-->src/utils.ts
    src/includeFiles/abstractions/k.ts-->src/includeFiles/abstractions/l.ts
    src/includeFiles/abstractions/k.ts-->src/utils.ts
    src/main.ts-->src/includeFiles/a.ts
    src/main.ts-->src/includeFiles/b.ts
    src/main.ts-->src/otherFiles/d.ts
    src/main.ts-->src/otherFiles/e.ts
    src/main.ts-->src/includeFiles/abstractions/j.ts
    src/main.ts-->src/includeFiles/abstractions/k.ts
    src/main.ts-->src/utils.ts
```

👆 のようにファイルの依存関係が出力されます。

ごちゃごちゃして理解しにくいですね。
そして、大きなリポジトリの場合は、マーメイドが表示可能なデータの上限を超えるかもしれません。

その場合は、グラフに含めるディレクトリを絞り込む必要があります。

### `--include`

グラフに含めるディレクトリやファイルを絞り込むには `--include` オプションを使います。

```bash
tsg --include includeFiles config
```

```mermaid
flowchart
    classDef dir fill:#0000,stroke:#999
    subgraph src["src"]
        src/config.ts["config.ts"]
        src/utils.ts["utils.ts"]
        src/main.ts["main.ts"]
        subgraph src/includeFiles["/includeFiles"]
            src/includeFiles/b.ts["b.ts"]
            src/includeFiles/c.ts["c.ts"]
            src/includeFiles/a.ts["a.ts"]
            subgraph src/includeFiles/children["/children"]
                src/includeFiles/children/childA.ts["childA.ts"]
            end
            subgraph src/includeFiles/excludeFiles["/excludeFiles"]
                src/includeFiles/excludeFiles/g.ts["g.ts"]
                src/includeFiles/excludeFiles/i.ts["i.ts"]
                src/includeFiles/excludeFiles/h.ts["h.ts"]
            end
            subgraph src/includeFiles/abstractions["/abstractions"]
                src/includeFiles/abstractions/j.ts["j.ts"]
                src/includeFiles/abstractions/l.ts["l.ts"]
                src/includeFiles/abstractions/k.ts["k.ts"]
                subgraph src/includeFiles/abstractions/children["/children"]
                    src/includeFiles/abstractions/children/childA.ts["childA.ts"]
                end
            end
        end
        subgraph src/otherFiles["/otherFiles"]
            src/otherFiles/e.ts["e.ts"]
        end
    end
    src/includeFiles/b.ts-->src/utils.ts
    src/includeFiles/b.ts-->src/config.ts
    src/includeFiles/c.ts-->src/utils.ts
    src/includeFiles/c.ts-->src/includeFiles/b.ts
    src/config.ts-->src/utils.ts
    src/config.ts-->src/includeFiles/c.ts
    src/includeFiles/children/childA.ts-->src/utils.ts
    src/includeFiles/excludeFiles/g.ts-->src/includeFiles/children/childA.ts
    src/includeFiles/excludeFiles/g.ts-->src/utils.ts
    src/includeFiles/excludeFiles/i.ts-->src/utils.ts
    src/includeFiles/excludeFiles/h.ts-->src/includeFiles/excludeFiles/i.ts
    src/includeFiles/excludeFiles/h.ts-->src/utils.ts
    src/includeFiles/excludeFiles/h.ts-->src/config.ts
    src/includeFiles/a.ts-->src/includeFiles/children/childA.ts
    src/includeFiles/a.ts-->src/includeFiles/excludeFiles/g.ts
    src/includeFiles/a.ts-->src/includeFiles/excludeFiles/h.ts
    src/includeFiles/a.ts-->src/includeFiles/excludeFiles/i.ts
    src/includeFiles/a.ts-->src/utils.ts
    src/otherFiles/e.ts-->src/config.ts
    src/includeFiles/abstractions/j.ts-->src/utils.ts
    src/includeFiles/abstractions/j.ts-->src/includeFiles/abstractions/children/childA.ts
    src/includeFiles/abstractions/l.ts-->src/utils.ts
    src/includeFiles/abstractions/k.ts-->src/includeFiles/abstractions/l.ts
    src/includeFiles/abstractions/k.ts-->src/utils.ts
    src/main.ts-->src/includeFiles/a.ts
    src/main.ts-->src/includeFiles/b.ts
    src/main.ts-->src/includeFiles/abstractions/j.ts
    src/main.ts-->src/includeFiles/abstractions/k.ts
```

👆 のように `--include` で指定したディレクトリの依存関係が出力されます。
ただし、 `--include` で指定したディレクトリ配下のファイルから依存しているファイルは表示されたままになります。
もし興味のないディレクトリやファイルがあれば `--exclude` で除外しましょう。

### `--exclude`

utils が鬱陶しいですね。
グラフから除外したいディレクトリやファイルは、 `--exclude` オプションで除外します。

```bash
tsg --include includeFiles config --exclude excludeFiles utils
```

```mermaid
flowchart
    classDef dir fill:#0000,stroke:#999
    subgraph src["src"]
        src/config.ts["config.ts"]
        src/main.ts["main.ts"]
        subgraph src/includeFiles["/includeFiles"]
            src/includeFiles/b.ts["b.ts"]
            src/includeFiles/c.ts["c.ts"]
            src/includeFiles/a.ts["a.ts"]
            subgraph src/includeFiles/children["/children"]
                src/includeFiles/children/childA.ts["childA.ts"]
            end
            subgraph src/includeFiles/abstractions["/abstractions"]
                src/includeFiles/abstractions/j.ts["j.ts"]
                src/includeFiles/abstractions/l.ts["l.ts"]
                src/includeFiles/abstractions/k.ts["k.ts"]
                subgraph src/includeFiles/abstractions/children["/children"]
                    src/includeFiles/abstractions/children/childA.ts["childA.ts"]
                end
            end
        end
        subgraph src/otherFiles["/otherFiles"]
            src/otherFiles/e.ts["e.ts"]
        end
    end
    src/includeFiles/b.ts-->src/config.ts
    src/includeFiles/c.ts-->src/includeFiles/b.ts
    src/config.ts-->src/includeFiles/c.ts
    src/includeFiles/a.ts-->src/includeFiles/children/childA.ts
    src/otherFiles/e.ts-->src/config.ts
    src/includeFiles/abstractions/j.ts-->src/includeFiles/abstractions/children/childA.ts
    src/includeFiles/abstractions/k.ts-->src/includeFiles/abstractions/l.ts
    src/main.ts-->src/includeFiles/a.ts
    src/main.ts-->src/includeFiles/b.ts
    src/main.ts-->src/includeFiles/abstractions/j.ts
    src/main.ts-->src/includeFiles/abstractions/k.ts
```

`--exclude` で指定したディレクトリが依存関係グラフから除外されました。

おっと、 `src/includeFiles/b.ts`, `src/includeFiles/c.ts`, `src/config.ts` は循環参照になっていました。すぐにチームに報告してリファクタリングしましょう。でも、 `src/includeFiles/abstractions` はこの問題と関係がないので、できれば詳細を見せたくありません。 `--abstraction` で `src/includeFiles/abstractions` の詳細を隠すことができます。

### `--abstraction`

ディレクトリの中のファイルには関心はないけど、そのディレクトリとの依存関係はグラフに残したい場合があります。
その場合は `--abstraction` でディレクトリを抽象化しましょう。

```bash
tsg --include includeFiles config --exclude excludeFiles utils --abstraction abstractions
```

```mermaid
flowchart
    classDef dir fill:#0000,stroke:#999
    subgraph src["src"]
        src/config.ts["config.ts"]
        src/main.ts["main.ts"]
        subgraph src/includeFiles["/includeFiles"]
            src/includeFiles/b.ts["b.ts"]
            src/includeFiles/c.ts["c.ts"]
            src/includeFiles/a.ts["a.ts"]
            src/includeFiles/abstractions["/abstractions"]:::dir
            subgraph src/includeFiles/children["/children"]
                src/includeFiles/children/childA.ts["childA.ts"]
            end
        end
        subgraph src/otherFiles["/otherFiles"]
            src/otherFiles/e.ts["e.ts"]
        end
    end
    src/includeFiles/b.ts-->src/config.ts
    src/includeFiles/c.ts-->src/includeFiles/b.ts
    src/config.ts-->src/includeFiles/c.ts
    src/includeFiles/a.ts-->src/includeFiles/children/childA.ts
    src/otherFiles/e.ts-->src/config.ts
    src/main.ts-->src/includeFiles/a.ts
    src/main.ts-->src/includeFiles/b.ts
    src/main.ts-->src/includeFiles/abstractions
```

これで、チームと問題の共有がしやすくなりました 👍

## その他のオプション

### --mermaid-link

マーメイドのノードに、VSCode で開くためのリンクを付加します。マーメイドには以下のように click イベントが出力されます。

```
    click src/createGraph.ts href "vscode://file//your/path/typescript-graph/src/createGraph.ts" _blank
```

ただし、これはうまく動作しません。クリックイベントの定義も、URL も正しいですが、VSCode のマーメイドのプレビューでは動作しませんでした。いつか動作することを期待して実装した機能です 🤣
