import {StemNode} from '../lib/builder/audience_builder/nodes/stem.js';
import {IBuilderNode} from '../types/builder.js';
import {Nullable} from '../types/utilities.js';
import {
  AudienceBuilderNodeTypes,
  ExpressionCategories,
  ExpressionOperators,
  ExpressionTypes,
  ExpressionValueTuple,
  ExpressionValueTypeMap,
  IArrayExpression,
  IBooleanExpression,
  IDatetimeExpression,
  IFilterExpression,
  INumberExpression,
  IStringExpression,
  ValidExpressionValue,
} from '../types/audience_builder/index.js';
import {
  numericExpressionTypes,
  booleanExpressionTypes,
  datetimeExpressionTypes,
} from '../constants/audience_builder.js';
import {isBool, isDate, isNumber, isString} from './predicates.js';

export function isBooleanValue(
  value: Nullable<boolean>
): value is Nullable<boolean> {
  return typeof value === 'boolean' || value === null;
}

export function isFilterExpression(
  expression: IFilterExpression
): expression is IFilterExpression {
  const ex = expression as IFilterExpression;
  const [value] = ex.value;

  return (
    typeof ex.field === 'string' &&
    typeof value !== undefined &&
    Object.values(ExpressionTypes).includes(ex.type) &&
    ex.operator !== undefined
  );
}

/**
 * Determines whether an object is a string expression.
 */
export function isStringExpression(
  expression: IStringExpression
): expression is IStringExpression {
  const ex = expression as IStringExpression;
  const [value] = ex.value;

  return (
    isFilterExpression(expression) &&
    typeof value === 'string' &&
    ex.type === ExpressionTypes.STRING
  );
}

/**
 * Determines whether an object is a number expression.
 */
export function isNumberExpression(
  expression: INumberExpression
): expression is INumberExpression {
  const ex = expression as INumberExpression;
  const [value] = ex.value;

  return (
    isFilterExpression(expression) &&
    typeof value === 'number' &&
    numericExpressionTypes.includes(ex.type)
  );
}

/**
 * Determines whether an object is a boolean expression.
 */
export function isBooleanExpression(
  expression: IBooleanExpression
): expression is IBooleanExpression {
  const ex = expression as IBooleanExpression;
  const [value] = ex.value;

  return (
    isFilterExpression(expression) &&
    isBooleanValue(value) &&
    booleanExpressionTypes.includes(ex.type)
  );
}

/**
 * Determines whether an object is a datetime expression.
 */
export function isDatetimeExpression(
  expression: IDatetimeExpression
): expression is IDatetimeExpression {
  const ex = expression as IDatetimeExpression;
  const [value] = ex.value;

  return (
    isFilterExpression(expression) &&
    value instanceof Date &&
    datetimeExpressionTypes.includes(ex.type)
  );
}

/**
 * Determines whether an object is a datetime expression.
 */
export function isArrayExpression(
  expression: IArrayExpression
): expression is IArrayExpression {
  const ex = expression as IArrayExpression;
  const [value] = ex.value;

  return (
    isFilterExpression(expression) &&
    Array.isArray(value) &&
    value.every(x => ['string', 'number'].includes(typeof x))
  );
}

/**
 * Returns a null expression value.
 */
export function nullExpressionValue<
  T = ValidExpressionValue,
>(): ExpressionValueTuple<T> {
  return [null];
}

/**
 * Given an ExpressionType, return an ExpressionCategory
 * @param type ExpressionTypes - The type of the expression you want a category for.
 * @returns ExpressionCategories
 */
export function typeToCategory(type: ExpressionTypes): ExpressionCategories {
  switch (type) {
    default:
    case ExpressionTypes.STRING: {
      return ExpressionCategories.STRING;
    }

    case ExpressionTypes.NUMBER:
    case ExpressionTypes.NUMERIC:
    case ExpressionTypes.INT:
    case ExpressionTypes.INT_64:
    case ExpressionTypes.FLOAT:
    case ExpressionTypes.FLOAT_64:
    case ExpressionTypes.INTEGER:
    case ExpressionTypes.INTEGER_64: {
      return ExpressionCategories.NUMBER;
    }

    case ExpressionTypes.DATETIME:
    case ExpressionTypes.TIMESTAMP:
    case ExpressionTypes.DATE: {
      return ExpressionCategories.DATETIME;
    }

    case ExpressionTypes.BOOL:
    case ExpressionTypes.BOOLEAN: {
      return ExpressionCategories.BOOLEAN;
    }

    case ExpressionTypes.ARRAY: {
      return ExpressionCategories.ARRAY;
    }
  }
}

export function isFilter(node: IBuilderNode): boolean {
  if (node.type === AudienceBuilderNodeTypes.FILTER) return true;
  if (node.type === AudienceBuilderNodeTypes.FLEX) return true;
  if (node.type === AudienceBuilderNodeTypes.AUDIENCE) return true;
  if (node.type === AudienceBuilderNodeTypes.STEM && node instanceof StemNode) {
    return node.treatAsFilter;
  }

  return false;
}

export function isOperatable(node: IBuilderNode) {
  return isFilter(node) || isFlex(node);
}

export function isFlex(node: IBuilderNode) {
  return node.type === AudienceBuilderNodeTypes.FLEX;
}

export function isStem(node: IBuilderNode): node is StemNode {
  if (node.type === AudienceBuilderNodeTypes.STEM) return true;
  if (node.type === AudienceBuilderNodeTypes.FLEX) return true;
  return false;
}

function isValidExpression(x: unknown): x is IFilterExpression['value'] {
  if (!Array.isArray(x)) return false;
  return x.length === 1 && x.every(v => v === null);
}

/** Determines whether or not a given value is a valid StringExpression value. */
export function isStringValue(x: unknown): x is IStringExpression['value'] {
  if (!isValidExpression(x)) return false;
  return x.every(isString);
}

/** Determines whether or not a given value is a valid NumberExpression value. */
export function isNumericValue(x: unknown): x is INumberExpression['value'] {
  if (!isValidExpression(x)) return false;
  return x.every(isNumber);
}

/** Determines whether or not a given value is a valid DatetimeExpression value. */
export function isDatetimeValue(x: unknown): x is IDatetimeExpression['value'] {
  if (!isValidExpression(x)) return false;
  return x.every(isDate);
}

/** Determines whether or not a given value is a valid BooleanExpression value. */
export function isBoolValue(x: unknown): x is IBooleanExpression['value'] {
  if (!isValidExpression(x)) return false;
  return x.every(isBool);
}

/** Determines whether or not a given value is a valid ArrayExpression value. */
export function isArrayValue(x: unknown): x is IArrayExpression['value'] {
  if (!isValidExpression(x)) return false;
  return x.every(y => ['string', 'number'].includes(typeof y));
}

/** Determines whether or not a value is a valid expression type. */
export function isExpressionOperator(x: unknown): x is ExpressionOperators {
  if (!isString(x)) return false;
  return Object.values(ExpressionOperators).includes(x as ExpressionOperators);
}

/** Determines whether or not a value is a valid expression type. */
export function isExpressionType(x: unknown): x is ExpressionTypes {
  if (!isString(x)) return false;
  return Object.values(ExpressionTypes).includes(x as ExpressionTypes);
}

/**
 * Determines whether a given value corresponds to an expression type.
 */
export function isValidExpressionValue<T extends ExpressionTypes>(
  type: T,
  value: unknown
): value is ExpressionValueTypeMap[T] {
  switch (typeToCategory(type)) {
    case ExpressionCategories.STRING: {
      return isStringValue(value);
    }

    case ExpressionCategories.NUMBER: {
      return isNumericValue(value);
    }

    case ExpressionCategories.DATETIME: {
      return isDatetimeValue(value);
    }

    case ExpressionCategories.BOOLEAN: {
      return isBoolValue(value);
    }

    case ExpressionCategories.ARRAY: {
      return isArrayValue(value);
    }
  }
}
