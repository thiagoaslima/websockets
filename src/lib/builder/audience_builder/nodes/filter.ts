import {
  LAYER_ROOT_KEY,
  nullOperators,
} from '../../../../constants/audience_builder.js';
import {
  BuilderStoreNodeFactoryParams,
  IBuilderAtomConstructorParams,
} from '../../../../types/builder.js';
import {
  AudienceBuilderNodeTypes,
  IFilterExpression,
  IStringExpression,
  FilterOperators,
  ExpressionValueTuple,
  ExpressionOperators,
  ExpressionTypes,
  IBooleanExpression,
  INumberExpression,
  IDatetimeExpression,
  NumberExpressionType,
  DatetimeExpressionType,
  IArrayExpression,
  ValidArrayExpressionValue,
  IAudienceBuilderNode,
  BooleanExpressionType,
  ExpressionValueTypeMap,
} from '../../../../types/audience_builder/index.js';
import {
  isArrayExpression,
  isBooleanExpression,
  isDatetimeExpression,
  isNumberExpression,
  isStringExpression,
  nullExpressionValue,
} from '../../../../utils/audience_builder.js';
import {BuilderNode} from '../../node.js';
import {v4} from 'uuid';

export interface FilterMetadata {
  negate: boolean;
  operator?: FilterOperators;
  expressions?: {[k: string]: FilterExpression};
  [k: string]: unknown;
}

export type ExpressionCreateParams<T = unknown> = {
  field: string;
  displayName?: string;
  defaults?: ExpressionDefaults<T>;
};

export type FilterNodeMetadataMutation = (
  ctx: FilterMetadata | undefined
) => FilterMetadata;

export type ExpressionDefaults<T = unknown> = {
  operator?: ExpressionOperators;
  value?: ExpressionValueTuple<T>;
};

export enum FilterUpdateContexts {
  EXPRESSIONS = 'expressions',
  OPERATOR = 'operator',
  NEGATION = 'negation',
}

/**
 * Creates a filter expression.
 */
export function createExpressionFromType<T extends ExpressionTypes>(
  type: T,
  {
    field,
    displayName,
    operator,
    value,
  }: {
    field: string;
    displayName?: string;
    operator?: ExpressionOperators;
    value?: ExpressionValueTypeMap[T];
  }
): FilterExpression {
  switch (type) {
    default:
    case ExpressionTypes.STRING: {
      const expression = StringExpression.create({field, displayName});
      if (operator) expression.operator = operator;
      if (value)
        expression.value =
          value as ExpressionValueTypeMap[ExpressionTypes.STRING];
      return expression;
    }

    case ExpressionTypes.NUMBER:
    case ExpressionTypes.NUMERIC:
    case ExpressionTypes.INT:
    case ExpressionTypes.INT_64:
    case ExpressionTypes.FLOAT:
    case ExpressionTypes.FLOAT_64:
    case ExpressionTypes.INTEGER:
    case ExpressionTypes.INTEGER_64: {
      const expression = NumberExpression.create(type, {field, displayName});
      if (operator) expression.operator = operator;
      if (value)
        expression.value =
          value as ExpressionValueTypeMap[ExpressionTypes.NUMBER];
      return expression;
    }

    case ExpressionTypes.DATETIME:
    case ExpressionTypes.TIMESTAMP:
    case ExpressionTypes.DATE: {
      const expression = DatetimeExpression.create(type, {field, displayName});
      if (operator) expression.operator = operator;
      if (value)
        expression.value =
          value as ExpressionValueTypeMap[ExpressionTypes.DATETIME];
      return expression;
    }

    case ExpressionTypes.BOOL:
    case ExpressionTypes.BOOLEAN: {
      const expression = BooleanExpression.create({field, displayName});
      if (operator) expression.operator = operator;
      if (value)
        expression.value =
          value as ExpressionValueTypeMap[ExpressionTypes.BOOLEAN];
      return expression;
    }

    case ExpressionTypes.ARRAY: {
      const expression = ArrayExpression.create({field, displayName});
      if (operator) expression.operator = operator;
      if (value)
        expression.value =
          value as ExpressionValueTypeMap[ExpressionTypes.ARRAY];
      return expression;
    }
  }
}

/**
 * Abstract, base filter expression class.
 */
export abstract class FilterExpression implements IFilterExpression {
  readonly field: string;
  readonly id = v4();

  abstract readonly type: ExpressionTypes;
  abstract operator: ExpressionOperators;
  abstract value: ExpressionValueTuple;

  displayName = '';

  constructor(field: string, displayName = '') {
    this.field = field;
    this.displayName = displayName;
  }

  toJSON() {
    const expressionLiteral: IFilterExpression = {
      id: this.id,
      field: this.field,
      value: this.value,
      displayName: this.displayName,
      operator: this.operator,
      type: this.type,
    };

    return expressionLiteral;
  }
}

/**
 * Stateful class for string expressions; to be used with filters.
 */
export class StringExpression
  extends FilterExpression
  implements IStringExpression
{
  readonly type = ExpressionTypes.STRING;

  operator = ExpressionOperators.EQUALS;
  value: ExpressionValueTuple<string[]> = nullExpressionValue<string[]>();

  static fromJSON(json: string): StringExpression | undefined {
    try {
      const parsed = JSON.parse(json);
      if (!isStringExpression(parsed)) throw Error('Invalid JSON');

      const expression = new StringExpression(parsed.field);
      expression.operator = parsed.operator;
      expression.value = parsed.value;

      return expression;
    } catch (err) {
      console.error(err);
    }
  }

  static create({
    field,
    displayName,
    defaults,
  }: ExpressionCreateParams<string[]>): StringExpression {
    const expression = new StringExpression(field, displayName);
    if (defaults?.operator) expression.operator = defaults.operator;
    if (defaults?.value) expression.value = defaults.value;
    return expression;
  }
}

/**
 * Stateful class for integer expressions; to be used with filters.
 */
export class NumberExpression
  extends FilterExpression
  implements INumberExpression
{
  readonly type: NumberExpressionType = ExpressionTypes.INTEGER;

  operator = ExpressionOperators.EQUALS;
  value: ExpressionValueTuple<number> = nullExpressionValue<number>();

  private constructor(
    field: string,
    type: NumberExpressionType,
    displayName = ''
  ) {
    super(field, displayName);
    this.type = type;
  }

  static fromJSON(json: string): NumberExpression | undefined {
    try {
      const parsed = JSON.parse(json);
      if (!isNumberExpression(parsed)) throw Error('Invalid JSON');

      const expression = new NumberExpression(parsed.field, parsed.type);
      expression.operator = parsed.operator;
      expression.value = parsed.value;

      return expression;
    } catch (err) {
      console.error(err);
    }
  }

  static create(
    type: NumberExpressionType,
    {field, displayName, defaults}: ExpressionCreateParams<number>
  ): NumberExpression {
    const expression = new NumberExpression(field, type, displayName);
    if (defaults?.operator) expression.operator = defaults.operator;
    if (defaults?.value) expression.value = defaults.value;
    return expression;
  }
}

/**
 * Stateful class for boolean expressions; to be used with filters.
 */
export class BooleanExpression
  extends FilterExpression
  implements IBooleanExpression
{
  readonly type: BooleanExpressionType = ExpressionTypes.BOOL;

  operator = ExpressionOperators.EQUALS;
  value: ExpressionValueTuple<boolean> = nullExpressionValue<boolean>();

  static fromJSON(json: string): BooleanExpression | undefined {
    try {
      const parsed = JSON.parse(json);
      if (!isBooleanExpression(parsed)) throw Error('Invalid JSON');

      const expression = new BooleanExpression(parsed.field);
      expression.operator = parsed.operator;
      expression.value = parsed.value;

      return expression;
    } catch (err) {
      console.error(err);
    }
  }

  static create({
    field,
    displayName,
    defaults,
  }: ExpressionCreateParams<boolean>): BooleanExpression {
    const expression = new BooleanExpression(field, displayName);
    if (defaults?.operator) expression.operator = defaults.operator;
    if (defaults?.value) expression.value = defaults.value;
    return expression;
  }
}

/**
 * Stateful class for date / timestamp expressions; to be used with filters.
 */
export class DatetimeExpression
  extends FilterExpression
  implements IDatetimeExpression
{
  readonly type: DatetimeExpressionType = ExpressionTypes.DATE;

  private constructor(
    field: string,
    type: DatetimeExpressionType,
    displayName = ''
  ) {
    super(field, displayName);
    this.type = type;
  }

  operator = ExpressionOperators.EQUALS;
  value: ExpressionValueTuple<Date | number> = nullExpressionValue<Date>();

  static fromJSON(json: string): DatetimeExpression | undefined {
    try {
      const parsed = JSON.parse(json);
      if (!isDatetimeExpression(parsed)) throw Error('Invalid JSON');

      const expression = new DatetimeExpression(parsed.field, parsed.type);
      expression.operator = parsed.operator;
      expression.value = parsed.value;

      return expression;
    } catch (err) {
      console.error(err);
    }
  }

  static create(
    type: DatetimeExpressionType,
    {field, displayName, defaults}: ExpressionCreateParams<Date>
  ): DatetimeExpression {
    const expression = new DatetimeExpression(field, type, displayName);
    if (defaults?.operator) expression.operator = defaults.operator;
    if (defaults?.value) expression.value = defaults.value;
    return expression;
  }
}

/**
 * Stateful class for array expressions; to be used with filters.
 */
export class ArrayExpression
  extends FilterExpression
  implements IArrayExpression
{
  readonly type = ExpressionTypes.ARRAY;

  operator = ExpressionOperators.EQUALS;
  value: ExpressionValueTuple<ValidArrayExpressionValue> =
    nullExpressionValue<ValidArrayExpressionValue>();

  static fromJSON(json: string): ArrayExpression | undefined {
    try {
      const parsed = JSON.parse(json);
      if (!isArrayExpression(parsed)) throw Error('Invalid JSON');

      const expression = new ArrayExpression(parsed.field);
      expression.operator = parsed.operator;
      expression.value = parsed.value;

      return expression;
    } catch (err) {
      console.error(err);
    }
  }

  static create({
    field,
    displayName,
    defaults,
  }: ExpressionCreateParams<ValidArrayExpressionValue>): ArrayExpression {
    const expression = new ArrayExpression(field, displayName);
    if (defaults?.operator) expression.operator = defaults.operator;
    if (defaults?.value) expression.value = defaults.value;
    return expression;
  }
}

/**
 * A node that uses dataset fields to filter customer data within
 * the audience builder.
 */
export class FilterNode
  extends BuilderNode<FilterMetadata>
  implements IAudienceBuilderNode
{
  readonly type = AudienceBuilderNodeTypes.FILTER;

  // Default values, to be overridden by 'create'
  level = LAYER_ROOT_KEY;
  index = 0;

  operator?: FilterOperators;
  expressions: Map<string, FilterExpression> = new Map();
  negate = false;
  touched = false;

  // Used to check diff for sending counts;
  private previousExpressionState = false;

  // If the parents have public constructors (which they have to, since they're abstract),
  // so do the children.
  constructor(params: IBuilderAtomConstructorParams) {
    super(params);
  }

  get metadata(): FilterMetadata {
    return {
      negate: this.negate,
      operator: this.operator,
      expressions: Object.fromEntries(this.expressions.entries()),
    };
  }

  hasValidExpressions(): boolean {
    const expressions = Array.from(this.expressions.values());

    return expressions.some(x => {
      const hasValues = x.value.every(x => {
        if (Array.isArray(x)) return x.length;
        return x !== null && typeof x !== 'undefined';
      });

      return nullOperators.includes(x.operator) || (x.operator && hasValues);
    });
  }

  isValid(): boolean {
    const validDiff = this.touched && this.previousExpressionState;
    this.previousExpressionState = this.hasValidExpressions();
    return this.hasValidExpressions() || validDiff;
  }

  touch() {
    if (!this.touched && this.isValid()) {
      this.touched = true;
    }
  }

  hasField(fieldId: string): boolean {
    return Array.from(this.expressions.values()).some(expression => {
      return expression.field === fieldId;
    });
  }

  addExpression(expression: FilterExpression): void {
    this.expressions.set(expression.id, expression);
    this.touch();

    this.emitUpdateEvent<FilterNode>(FilterUpdateContexts.EXPRESSIONS);
  }

  getExpression(id: string): FilterExpression | undefined {
    return this.expressions.get(id);
  }

  updateNegation(bool: boolean) {
    this.negate = bool;
    this.touch();

    this.emitUpdateEvent<FilterNode>(FilterUpdateContexts.NEGATION);
  }

  updateOperator(op: FilterOperators) {
    this.operator = op;
    this.touch();

    this.emitUpdateEvent<FilterNode>(FilterUpdateContexts.OPERATOR);
  }

  updateExpression<T extends FilterExpression>(
    id: string,
    mutationFn: (expression: T) => T
  ): void {
    if (!this.expressions.has(id)) return;
    const expression = this.expressions.get(id);
    this.expressions.set(id, mutationFn(expression as T));
    this.touch();

    this.emitUpdateEvent<FilterNode>(FilterUpdateContexts.EXPRESSIONS);
  }

  removeExpression(id: string): void {
    if (!this.expressions.has(id)) return;
    this.expressions.delete(id);
    this.touch();

    this.emitUpdateEvent<FilterNode>(FilterUpdateContexts.EXPRESSIONS);
  }

  static fromStore(params: BuilderStoreNodeFactoryParams): FilterNode {
    const filter = new FilterNode({id: params.id});
    const metadata = params.metadata as FilterMetadata;

    filter.level = params.level || LAYER_ROOT_KEY;
    filter.index = params.index || 0;

    if (metadata.operator) {
      filter.operator = metadata.operator;
    }

    if (metadata.negate) {
      filter.negate = metadata.negate;
    }

    if (metadata.expressions) {
      filter.expressions = new Map(Object.entries(metadata.expressions));
    }

    if (params.tags?.length) {
      filter.tags = new Set(params.tags);
    }

    return filter;
  }

  static create(params: {
    id?: string;
    level?: string;
    index?: number;
  }): FilterNode {
    const filter = new FilterNode({id: params.id});

    filter.level = params.level || LAYER_ROOT_KEY;
    filter.index = params.index || 0;

    return filter;
  }
}
