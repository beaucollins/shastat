export function notImplemented<T extends unknown[], R>(reason = 'not implemented') {
  return (..._args: T): Promise<R> => Promise.reject(new Error(reason));
}
