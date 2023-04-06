import childA from './children/childA';
import a2 from './excludeFiles/g';
import b2 from './excludeFiles/h';
import c2 from './excludeFiles/i';
import { style } from './excludeFiles/style/style';
import ClassA from './excludeFiles/class/classA';
import * as d from './d';

export default function a() {
  childA();
  a2();
  b2();
  c2();
}
import { log } from '../utils';
