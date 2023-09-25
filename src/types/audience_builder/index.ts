import {IBuilderQueryCtx} from '@v2/types/builder';
import {Nullable} from '../../general';

export interface IAudienceBuilderNode {
  isValid(): boolean;
  onNeighborOpChange?: (operator: NeighborOperators) => void;
}

export interface IAudienceBuilderQueryCtx extends IBuilderQueryCtx {
  runInsightsRequest?: boolean;
  runSaveOrUpdateRequest?: boolean;
}

export type AudienceBuilderField = {
  id: string;
  name: string;
  dataset: string;
  table: string;
  type: ExpressionTypes;
  display_name: string;
  description?: string;
};

export enum AudienceBuilderView {
  DEFAULT = 'default',
  DISPLAY = 'display',
}

export enum AudienceBuilderNodeTypes {
  STEM = 'stem',
  FILTER = 'filter',
  FLEX = 'flex',
  AUDIENCE = 'audience',
  HEADING = 'heading',
  SECTION = 'section',
  TEXT = 'text',
  GOOGLE_AD = 'google_ad',
  GOOGLE_DISPLAY_AD = 'google_display_ad',
  TYPEFACE_TWITTER_POST = 'typeface_twitter_post',
  TYPEFACE_BLOG_POST = 'typeface_blog_post',
  TYPEFACE_EMAIL = 'typeface_email',
}

export enum AudienceBuilderTemplateKeys {
  DEFAULT = 'default',
}

export enum AudienceBuilderContext {
  LANDING = 'landing',
  SETTING_UP = 'setting-up',
  BUILDING = 'building',
}

export enum NodeOperatorTypes {
  FILTER = 'filter',
  NEIGHBOR = 'neighbor',
}

export enum NeighborOperators {
  AND = 'and',
  OR = 'or',
  XOR = 'xor',
  AND_NOT = 'and_not',
}

export enum FilterOperators {
  AND = 'AND',
  OR = 'OR',
}

export enum ExpressionOperators {
  /**
   * Symbolic operators
   */
  EQUALS = '==',
  DOES_NOT_EQUAL = '!=',
  GREATER_THAN = '>',
  LESS_THAN = '<',
  GREATER_THAN_OR_EQUAL = '>=',
  LESS_THAN_OR_EQUAL = '<=',
  /**
   * Null operators
   */
  IS_NULL = 'is_null',
  IS_NOT_NULL = 'is_not_null',
  /**
   * Wildcard operators
   */
  STARTS_WTIH = 'starts_with',
  ENDS_WITH = 'ends_with',
  CONTAINS = 'contains',
  /**
   * Between operators
   */
  BETWEEN = 'between',
  BETWEEN_DAYS_AGO = 'between_days_ago',
  ON_DAYS_AGO = 'on_days_ago',
  BETWEEN_DAYS_FROM_NOW = 'between_days_from_now',
  ON_DAYS_FROM_NOW = 'on_days_from_now',
  /**
   * List operators
   */
  LENGTH_EQUALS = 'length_equals',
  LENGTH_GREATER = 'length_greater',
  LENGTH_LESS = 'length_less',
  IS_EMPTY = 'empty',
  IS_NOT_EMPTY = 'not_empty',
  /**
   * Datetime operators
   */
  IN_LAST_DAYS = 'in_last_days',
  OVER_DAYS_AGO = 'over_days_ago',
  IN_NEXT_DAYS = 'in_next_days',
  OVER_DAYS_FROM_NOW = 'over_days_from_now',
}

export enum ExpressionTypes {
  STRING = 'STRING',

  BOOL = 'BOOL',
  BOOLEAN = 'BOOLEAN',

  /**
   * Number types
   */
  NUMBER = 'NUMBER',
  INT = 'INT',
  INT_64 = 'INT64',
  INTEGER = 'INTEGER',
  INTEGER_64 = 'INTEGER64',
  FLOAT = 'FLOAT',
  FLOAT_64 = 'FLOAT64',
  NUMERIC = 'NUMERIC',
  /**
   * Date types
   */
  DATE = 'DATE',
  DATETIME = 'DATETIME',
  TIMESTAMP = 'TIMESTAMP',

  ARRAY = 'ARRAY',
}

export enum InputExpressionTypes {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  DATE = 'DATE',
  NULL = 'NULL',
}

export type DatetimeExpressionType =
  | ExpressionTypes.DATE
  | ExpressionTypes.DATETIME
  | ExpressionTypes.TIMESTAMP;

export type NumberExpressionType =
  | ExpressionTypes.NUMBER
  | ExpressionTypes.INT
  | ExpressionTypes.INT_64
  | ExpressionTypes.INTEGER
  | ExpressionTypes.INTEGER_64
  | ExpressionTypes.NUMERIC
  | ExpressionTypes.FLOAT
  | ExpressionTypes.FLOAT_64;

export type BooleanExpressionType =
  | ExpressionTypes.BOOL
  | ExpressionTypes.BOOLEAN;

export type ValidArrayEnumerable = (string | number)[];
export type ValidArrayExpressionValue = ValidArrayEnumerable | number;

export type ValidExpressionValue =
  | string
  | number
  | boolean
  | Date
  | ValidArrayExpressionValue;

export type ExpressionValueTuple<T = ValidExpressionValue> = [
  Nullable<T>,
  Nullable<T>?
];

export type ExpressionOperatorDisplay = {
  label: string;
  suffix: string;
};

export enum ExpressionValueIdices {
  ONE = 0,
  TWO = 1,
}

export interface IFilterExpression {
  readonly field: string; // The field name/id to operate on.
  readonly type: ExpressionTypes;
  readonly id: string;
  readonly description?: string;
  operator: ExpressionOperators;
  value: ExpressionValueTuple;
  displayName?: string;
}

export interface IStringExpression extends IFilterExpression {
  readonly type: ExpressionTypes.STRING;
  value: ExpressionValueTuple<string[]>;
}

export interface INumberExpression extends IFilterExpression {
  readonly type: NumberExpressionType;
  value: ExpressionValueTuple<number>;
}

export interface IBooleanExpression extends IFilterExpression {
  readonly type: BooleanExpressionType;
  value: ExpressionValueTuple<boolean>;
}

export interface IDatetimeExpression extends IFilterExpression {
  readonly type: DatetimeExpressionType;
  value: ExpressionValueTuple<Date | number>;
}

export interface IArrayExpression extends IFilterExpression {
  readonly type: ExpressionTypes.ARRAY;
  value: ExpressionValueTuple<ValidArrayExpressionValue>;
}

export enum AudienceBuilderNodeTags {
  IMMOVABLE = 'immovable',
  UNMANAGEABLE = 'unmanageable',
  PERMANENT = 'permanent',
}

export enum FieldBreakdownTypes {
  RATIO = 'ratio',
  VALUES = 'values',
}

/**
 * A value to count breakdown for a given field.
 */
export type FieldBreakdownDatum = {
  // A value belonging to the breakdown field. Note: it is called 'field'
  // because Quervice calls it 'field'
  field: string;
  // The total number of matching customers for this value.
  count: number;
};

/**
 * An object containing a field id and a list of value breakdowns.
 */
export type FieldBreakdown = {
  // The id of the field.
  id: string;
  // The style of the breakdown report.
  type: FieldBreakdownTypes;
  // The state of the UI for the breakdown.
  state: FieldBreakdownState;
  // The breakdown data for the field.
  data: Nullable<FieldBreakdownDatum[]>;
};

export type SerializedBreakdown = Omit<FieldBreakdown, 'state' | 'data'>;

/**
 * An object representing the state for certain UI interactions
 * with a field breakdown report.
 */
export type FieldBreakdownState = {
  fetching: boolean;
  collapsed: boolean;
  viewMore: boolean;
};

/**
 * Preference value containing parameters for configuring the audience builder.
 */
export type BuilderPreferenceValue = {
  /** Determines whether or not auto-save should be enabled. */
  isAutoSaveEnabled: boolean;
  /** Determines whether or not auto report refresh should be enabled. */
  isAutoReportRefreshEnabled: boolean;
};

export type AudienceBuilderPolicies = {
  newDataset: boolean;
};
