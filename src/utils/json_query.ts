import {JSONQueryField, NodeFilterMap} from '../types/json_query.js';
import {isPlainObject} from './predicates.js';
import {FilterNode} from '../lib/builder/audience_builder/nodes/filter.js';
import {createExpressionFromType} from '../lib/builder/audience_builder/nodes/filter.js';
import {FieldSchema, FullSchemaResponse} from '../types/schemas.js';
import {isExpressionType, isValidExpressionValue} from './audience_builder.js';
import {
  ExpressionOperators,
  ExpressionTypes,
} from '../types/audience_builder/index.js';

/**
 * Validates x is a JSONQueryField
 * @param x data
 * @returns boolean
 */
export function isJSONQueryField(x: unknown): x is JSONQueryField {
  return (
    isPlainObject(x) &&
    'field_name' in x &&
    'operator' in x &&
    'field_value' in x
  );
}

/**
 * Validates NodeFilterMap
 * @param x data
 * @returns boolean
 */
export function isNodeFilterMap(x: unknown): x is NodeFilterMap {
  return (
    isPlainObject(x) &&
    'and' in x &&
    Array.isArray(x['and']) &&
    x['and'].every(filter => isJSONQueryField(filter))
  );
}

export function JSONQueryOperatorToExpressionOperator(
  operator: string
): ExpressionOperators {
  switch (operator) {
    case 'in':
    case '==':
    case 'equals':
      return ExpressionOperators.EQUALS;
    case '!=':
    case 'does_not_equal':
      return ExpressionOperators.DOES_NOT_EQUAL;
    case '>':
    case 'greater_than':
      return ExpressionOperators.GREATER_THAN;
    case '<':
    case 'less_than':
      return ExpressionOperators.LESS_THAN;
    case '>=':
    case 'greater_than_or_equal':
      return ExpressionOperators.GREATER_THAN_OR_EQUAL;
    case '<=':
    case 'less_than_or_equal':
      return ExpressionOperators.LESS_THAN_OR_EQUAL;
    case 'isnull':
    case 'is_null':
      return ExpressionOperators.IS_NULL;
    case 'isnotnull':
    case 'is_not_null':
      return ExpressionOperators.IS_NOT_NULL;
    case 'startswith':
    case 'starts_with':
      return ExpressionOperators.STARTS_WTIH;
    case 'endswith':
    case 'ends_with':
      return ExpressionOperators.ENDS_WITH;
    case 'contains':
      return ExpressionOperators.CONTAINS;
    case 'between':
      return ExpressionOperators.BETWEEN;
    case 'between_days_ago':
      return ExpressionOperators.BETWEEN_DAYS_AGO;
    case 'on_days_ago':
      return ExpressionOperators.ON_DAYS_AGO;
    case 'between_days_from_now':
      return ExpressionOperators.BETWEEN_DAYS_FROM_NOW;
    case 'on_days_from_now':
      return ExpressionOperators.ON_DAYS_FROM_NOW;
    case 'length_equals':
      return ExpressionOperators.LENGTH_EQUALS;
    case 'length_greater':
      return ExpressionOperators.LENGTH_GREATER;
    case 'length_less':
      return ExpressionOperators.LENGTH_LESS;
    case 'empty':
      return ExpressionOperators.IS_EMPTY;
    case 'not_empty':
      return ExpressionOperators.IS_NOT_EMPTY;
    case 'in_last_days':
      return ExpressionOperators.IN_LAST_DAYS;
    case 'over_days_ago':
      return ExpressionOperators.OVER_DAYS_AGO;
    case 'in_next_days':
      return ExpressionOperators.IN_NEXT_DAYS;
    case 'over_days_from_now':
      return ExpressionOperators.OVER_DAYS_FROM_NOW;
  }
  throw Error(`Operator not found: "${operator}"`);
}

/**
 * Returns field type
 * @param field JSONQueryField
 * @param schema FullSchemaResponse
 * @returns FieldSchema
 */
export function getFieldType(
  field: JSONQueryField,
  schema: FullSchemaResponse
): FieldSchema {
  // Get all names from field_name which is defined as follows: {dataset_name}.{table_name}.{field_name}
  const [datasetName, tableName, fieldName] = field.field_name.split('.');

  const dataset = schema.data.datasets.find(
    dataset => dataset.name === datasetName
  );
  if (!dataset) throw Error('Unable to find target dataset in schema.');

  const table = dataset.tables.find(table => table.name === tableName);
  if (!table) throw Error('Unable to find target table in schema.');

  const fieldType = table.fields.find(
    tableField => tableField.name === fieldName
  );

  if (fieldType === undefined) throw Error('field type is not defined');
  return fieldType;
}

/**
 * Returns field value
 * @param field JsonQueryField
 * @param fieldType FieldSchema
 * @returns field value
 */
export function getFieldValue(
  field: JSONQueryField,
  fieldType: FieldSchema
): unknown[] {
  // Ensure that the field value is valid.
  let fieldValue: unknown[] = [];
  switch (true) {
    case fieldType.source_type === ExpressionTypes.STRING: {
      fieldValue = Array.isArray(field.field_value)
        ? [field.field_value]
        : [[field.field_value]];
      break;
    }

    case Array.isArray(field.field_value): {
      fieldValue = field.field_value as unknown[];
      break;
    }

    default: {
      fieldValue = [field.field_value];
    }
  }
  return fieldValue;
}

/**
 * Converts JSON query filters to FilterNode type
 * @param field JSONQueryField - filter nodes
 * @param schema FullSchemaResponse provided in the request
 * @returns FilterNode
 */
export function queryFieldToFilterNode(
  field: JSONQueryField,
  schema: FullSchemaResponse
): FilterNode {
  const fieldName = field.field_name.split('.')[-1];

  const fieldType = getFieldType(field, schema);

  if (!isExpressionType(fieldType.source_type))
    throw Error('Unable to determine field type.');

  const fieldValue = getFieldValue(field, fieldType);
  if (!isValidExpressionValue(fieldType.source_type, fieldValue)) {
    throw Error(
      `Invalid field value for type "${fieldType.source_type}" in JSON query.`
    );
  }

  const expressionOperator = JSONQueryOperatorToExpressionOperator(
    field.operator
  );
  // Create filter node
  const filterNode = FilterNode.create({});

  const expression = createExpressionFromType(fieldType.source_type, {
    field: fieldName,
    displayName: fieldName,
    operator: expressionOperator,
    value: fieldValue,
  });

  filterNode.addExpression(expression);
  return filterNode;
}
