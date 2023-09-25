import {isNil} from '../utils/predicates.js';

export interface IResultSuccess<O = unknown> {
  data: O;
  ok: true;
  nil(): boolean;
}

export interface IResultFailure extends Error {
  data: null;
  ok: false;
  nil(): boolean;
}

export type Result<O = unknown> = IResultFailure | IResultSuccess<O>;

export class ResultOk<O = unknown> implements IResultSuccess<O> {
  private constructor(private _data: O) {}
  readonly ok = true;

  get data(): O {
    return this._data;
  }

  nil() {
    return isNil(this._data);
  }

  static create<O>(data: O) {
    return new ResultOk<O>(data);
  }
}

export class ResultErr extends Error implements IResultFailure {
  data = null;

  private constructor(message: string) {
    super(message);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
    this.name = this.constructor.name;
  }
  readonly ok = false;
  nil = () => true;

  static create(message = 'Result error') {
    return new ResultErr(message);
  }
}
