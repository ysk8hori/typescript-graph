import { WriteStream } from 'fs';

/** コンストラクタで WriteStream または 文字列の配列を指定し、それに対して出力を行う機能を持つクラス。 */
export default class WriteStreamWrapper {
  constructor(private output: WriteStream | string[]) {}

  write(str: string) {
    if (this.output instanceof WriteStream) {
      this.output.write(str);
    } else {
      this.output.push(str);
    }
  }
}
