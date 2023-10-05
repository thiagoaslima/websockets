/**
 * Used to get the Class level type (i.e., constructable) instead of
 * the instance level.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ClassType<T> = new (...args: any[]) => T;
