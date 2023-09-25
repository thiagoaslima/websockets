/** Determines if a value is a string or not */
export const isString = (value: unknown): value is string =>
  typeof value === 'string';

/** Determines if a value is a record object */
export function isPlainObject(x: unknown): x is Record<string, unknown> {
  return (
    typeof x === 'object' &&
    x !== null &&
    !Array.isArray(x) &&
    x.constructor.name === 'Object'
  );
}

/** Determines if a value is undefined */
export const isUndefined = (value: unknown): value is undefined =>
  typeof value === 'undefined';

/**
 * Determines if a value is null
 */
// eslint-disable-next-line eqeqeq
export const isNull = (value: unknown): value is null => value === null;

/** Determines if a value is null, undefined or NaN */
export const isNil = (value: unknown): value is null | undefined =>
  isUndefined(value) ||
  isNull(value) ||
  (typeof value === 'number' && isNaN(value));

/** Determines if a value is a nonempty string or not */
export const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && Boolean(value.trim().length);
