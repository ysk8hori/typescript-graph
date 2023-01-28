# TypeScript graph

A CLI to visualize the dependencies between files in the TypeScript codebase.

For example, the following command in the base directory of https://github.com/ysk8hori/numberplace will produce the following results:

```bash
tsg --include src/components/atoms/ConfigMenu --exclude test stories node_modules
```

```mermaid
flowchart TB
    subgraph src["src"]
        src/atoms.ts["atoms.ts"]
    subgraph src/components/atoms["src/components/atoms"]
        src/components/atoms/Button.tsx["Button.tsx"]
    subgraph src/components/atoms/ConfigMenu["src/components/atoms/ConfigMenu"]
        src/components/atoms/ConfigMenu/index.tsx["index.tsx"]
    subgraph src/components/atoms/ConfigMenu/MenuStack["src/components/atoms/ConfigMenu/MenuStack"]
        src/components/atoms/ConfigMenu/MenuStack/MenuStack.tsx["MenuStack.tsx"]
        src/components/atoms/ConfigMenu/MenuStack/index.ts["index.ts"]
    end
    subgraph src/components/atoms/ConfigMenu/MenuButton["src/components/atoms/ConfigMenu/MenuButton"]
        src/components/atoms/ConfigMenu/MenuButton/MenuButton.tsx["MenuButton.tsx"]
        src/components/atoms/ConfigMenu/MenuButton/index.ts["index.ts"]
    end
    end
    end
    subgraph src/pages["src/pages"]
    subgraph src/pages/GameContainer["src/pages/GameContainer"]
        src/pages/GameContainer/GameContainer.tsx["GameContainer.tsx"]
    end
    subgraph src/pages/GenerateGameContainer["src/pages/GenerateGameContainer"]
        src/pages/GenerateGameContainer/GenerateGameContainer.tsx["GenerateGameContainer.tsx"]
    end
    subgraph src/pages/StartMenu["src/pages/StartMenu"]
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

```
  -V, --version        output the version number
  --md <char>          Specify the name of the markdown file to be output. Default is typescript-graph.md.
  -d, --dir <char>     Specify the TypeScript code base to be analyzed. if tsconfig.json is not found, specify the directory where tsconfig.json is located.
  --include <char...>  specify multiple strings to be included in the path or filename to be included in the output
  --exclude <char...>  specify multiple strings in the path or filename to exclude from output
  --neo4j              output to neo4j on localhost:7687
  --clear-db           clear neo4j database before output
  -h, --help           display help for command
```
