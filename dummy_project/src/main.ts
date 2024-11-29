import a from './includeFiles/a';
import b from './includeFiles/b';
import a2 from './otherFiles/d';
import b2 from './otherFiles/e';
import a3 from './includeFiles/abstractions/j';
import b3 from './includeFiles/abstractions/k';
import ts from 'typescript';
import D from './includeFiles/D.vue';

export default function main() {
  a();
  b();
  a2();
  b2();
  a3();
  b3();
}
import { log } from './utils';
