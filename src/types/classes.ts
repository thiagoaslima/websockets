/**
 * Used to get the Class level type (i.e., constructable) instead of
 * the instance level.
 */
export type ClassType<T> = new (...args: any[]) => T;
