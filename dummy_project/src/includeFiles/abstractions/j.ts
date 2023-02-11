import { log } from '../../utils';
import childA from './children/childA';
import data from '../../../data.json';

export default function a() {
  childA();
  log();
}
