import childA from './children/childA';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const a2 = require('./excludeFiles/g');
const c2 = import('./excludeFiles/i');
import { style } from './excludeFiles/style/style';
import ClassA from './excludeFiles/class/classA';

export default async function a() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const b2 = require('./excludeFiles/h');
  const d = await import('./d/index');
  childA();
  a2();
  b2();
}
import { log } from '../utils';
