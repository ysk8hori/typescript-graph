export default interface Metrics<T> {
  get metrics(): T;
}

export type MetricsScope = 'file' | 'function' | 'class' | 'method' | 'object';
