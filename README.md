# TypeScript graph

<p align="center">
  <a href="/docs/README_en.md">English</a> •
  <a href="/docs/README_ja.md">日本語 (Japanese)</a> 
</p>

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
npm install --global @ysk8hori/typescript-graph
```

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
  --highlight <char...>    Specify the path and file name to highlight
  --LR                     Specify Flowchart orientation Left-to-Right
  --TB                     Specify Flowchart orientation Top-to-Bottom
  --config-file            Specify the relative path to the config file (from cwd or specified by -d, --dir). Default is .tsgrc.json.
  -h, --help               display help for command
```

## usage

Run `tsg` on the project you want to analyze.

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

👆 and outputs file dependencies.

It is cluttered and confusing.
Also, for large repositories, Mermaid may exceed the maximum amount of data that can be displayed.

In that case, you need to narrow down the directories to include in the graph.

### `--include`

Use the `--include` option to narrow down the directories and files to include in the graph.

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

The dependencies of the directory specified by `--include` will be output as shown in 👆.
However, files that depend on files under the directory specified by `--include` will remain visible.
If there are directories or files you are not interested in, use `--exclude` to exclude them.

#### Exclude Exception via Full Path Specification (Experimental)

There might be scenarios where you would want to ignore dependency relations for a certain folder using `exclude`, but within that folder, there may exist some files you wish to include in the graph. In such cases, you can use `--include` to specify the full path of a particular file, effectively removing it from the exclusion list. This ensures that the specified file is not left out despite the general exclusion of its parent folder.

### `--exclude`

Directories and files to be excluded from the graph are excluded with the `--exclude` option.

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

The directories specified with `--exclude` were excluded from the dependency graph.

Oops, `src/includeFiles/b.ts`, `src/includeFiles/c.ts` and `src/config.ts` were circular references. Report this immediately to your team for refactoring. However, `src/includeFiles/abstractions` has nothing to do with this issue, so we don't want to show them the details if possible. You can hide the details of `src/includeFiles/abstractions` with `--abstraction`.

### `--abstraction`

Sometimes you may not be interested in the files in a directory, but wish to keep the dependencies on that directory in the graph.
In such cases, use `--abstraction` to abstract the directory.

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

This makes it easier to share problems within the team👍.

However, I would like to emphasize what I would like to see emphasized 🤔.

### `--highlight`

Use `--highlight` to highlight nodes that need attention.

```bash
tsg --include includeFiles config --exclude excludeFiles utils --abstraction abstractions --highlight config.ts b.ts --LR
```

```mermaid
flowchart LR
    classDef dir fill:#0000,stroke:#999
    classDef highlight fill:yellow,color:black
    subgraph src["src"]
        src/config.ts["config.ts"]:::highlight
        src/main.ts["main.ts"]
        subgraph src/includeFiles["/includeFiles"]
            src/includeFiles/b.ts["b.ts"]:::highlight
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
    src/includeFiles/abstractions-->data.json
    src/main.ts-->src/includeFiles/a.ts
    src/main.ts-->src/includeFiles/b.ts
    src/main.ts-->src/includeFiles/abstractions
```

It makes it easier to share problems within the team. 👍

## Other Options

### --mermaid-link

Add a link to the Mermaid node to open it in VSCode; Mermaid will output a click event as follows

```
    click src/createGraph.ts href "vscode://file//your/path/typescript-graph/src/createGraph.ts" _blank
```

However, this does not work. The click event definition is correct, and the URL is correct, but it does not work in VSCode's Mermaid Preview. This is a feature I implemented in hopes that it will work someday🤣.
