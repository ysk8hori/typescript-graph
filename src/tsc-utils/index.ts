export function isTsFile(path: string) {
  return [
    '.ts',
    '.tsx',
    '.d.ts',
    '.js',
    '.jsx',
    '.json',
    '.tsbuildinfo',
    '.mjs',
    '.mts',
    '.d.mts',
    '.cjs',
    '.cts',
    '.d.cts',
    '.vue',
  ].some(ext => path.endsWith(ext));
}
