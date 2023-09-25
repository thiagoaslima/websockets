/** Enum of valid dataset types. */
export enum DatasetType {
  USER = 'customer_details',
  TRANSACTION = 'transactions',
  EVENT = 'events',
}

/** A union of all valid flex dataset. */
export type FlexDatasets = DatasetType.TRANSACTION | DatasetType.EVENT;
