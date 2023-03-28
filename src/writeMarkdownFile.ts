import { createWriteStream } from 'fs';
import mermaidify from './mermaidify';
import { Graph, OptionValues } from './models';
import WriteStreamWrapper from './WriteStreamWrapper';

type Options = Partial<OptionValues> & {
  rootDir: string;
  executedScript: string;
};

export async function writeMarkdownFile(
  markdownTitle: string,
  graph: Graph,
  options: Options,
) {
  return new Promise((resolve, reject) => {
    const filename = markdownTitle.endsWith('.md')
      ? markdownTitle
      : `./${markdownTitle}.md`;
    const _ws = createWriteStream(filename);
    _ws.on('finish', resolve);
    _ws.on('error', reject);
    const ws = new WriteStreamWrapper(_ws);

    ws.write('# typescript graph on mermaid\n');
    ws.write('\n');
    ws.write('```bash\n');
    ws.write(`${options.executedScript}\n`);
    ws.write('```\n');
    ws.write('\n');
    ws.write('```mermaid\n');
    mermaidify(ws, graph, options);
    ws.write('```\n');
    _ws.end();

    console.log(filename);
  });
}
