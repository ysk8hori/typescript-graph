export interface OptionValues {
  md?: string;
  mermaidLink?: boolean;
  dir?: string;
  tsconfig?: string;
  include?: string[];
  exclude?: string[];
  abstraction?: string[];
  highlight?: string[];
  LR?: boolean;
  TB?: boolean;
  configFile?: string;
  measureInstability?: boolean;
  vue?: boolean;
  metrics?: boolean;
  watchMetrics: boolean | string[];
  stdout?: boolean;
}
