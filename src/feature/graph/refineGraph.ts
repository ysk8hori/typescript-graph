import { piped } from 'remeda';
import { getConfig } from '../../setting/config';
import type { OptionValues } from '../../setting/model';
import { abstraction } from './abstraction';
import { filterGraph } from './filterGraph';
import { highlight } from './highlight';
import type { Graph } from './models';

/** filter, abstraction, highlight を行う */
export const bind_refineGraph = (
  commandOptions: OptionValues,
): ((fullGraph: Graph) => Graph) =>
  piped(
    graph =>
      filterGraph(
        commandOptions.include,
        [...(getConfig().exclude ?? []), ...(commandOptions.exclude ?? [])],
        graph,
      ),
    graph => abstraction(commandOptions.abstraction, graph),
    graph => highlight(commandOptions.highlight, graph),
  );
