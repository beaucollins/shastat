import { Result, isSuccess, Success, Failure } from '@fracture/parse';

export function requireSuccess<T, F>(result: Result<T, F>): Success<T> {
  if (!isSuccess(result)) {
    throw new Error(result.reason);
  }
  return result;
}

export function requireFailure<T, F>(result: Result<T, F>): Failure<F> {
  if (isSuccess(result)) {
    throw new Error('Expected failure');
  }
  return result;
}
