import {StemNode} from '../lib/builder/audience_builder/nodes/stem.js';
import {IBuilderNode} from '../types/builder.js';
import {Nullable} from '../types/utilities.js'
import {
  AudienceBuilderField,
  AudienceBuilderNodeTypes,
  ExpressionTypes,
  ExpressionValueTuple,
  IArrayExpression,
  IBooleanExpression,
  IDatetimeExpression,
  IFilterExpression,
  INumberExpression,
  IStringExpression,
  ValidArrayExpressionValue,
  ValidExpressionValue,
} from '../types/audience_builder/index.js';
import {
  numericExpressionTypes,
  booleanExpressionTypes,
  datetimeExpressionTypes,
} from '../constants/audience_builder.js';

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
  T = ValidExpressionValue
>(): ExpressionValueTuple<T> {
  return [null];
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
