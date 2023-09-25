/**
 * To be used when an expression is allowed to be null;
 * prefer this over undefined since it's explicit.
 */
export type Nullable<T> = null | T;
