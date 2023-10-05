import {JSONQueryField, NodeFilterMap} from "../types/json_query.js";
import {isPlainObject} from "./predicates.js";
import {FilterNode} from "../lib/builder/audience_builder/nodes/filter.js";
import {createExpressionFromType} from "../lib/builder/audience_builder/nodes/filter.js";
import {ExpressionTypes} from "../types/audience_builder/index.js";
import {FullSchemaResponse} from "../types/schemas.js";
import {
  isExpressionOperator,
  isExpressionType,
  isValidExpressionValue,
} from "./audience_builder.js";


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

/**
 * Converts JSON query filters to FilterNode type
 * @param field JSONQueryField - filter nodes
 * @param schema FullSchemaResponse provided in the request
 * @returns FilterNode
 */
export function queryFieldToFilterNode(field: JSONQueryField, schema: FullSchemaResponse): FilterNode {
  // Get all names from field_name which is defined as follows: {dataset_name}.{table_name}.{field_name}
  const [datasetName, tableName, fieldName]  = field.field_name.split('.');

  const dataset = schema.data.datasets.find(dataset => dataset.name === datasetName);
  if (!dataset) throw Error('Unable to find target dataset in schema.');

  const table = dataset.tables.find(table => table.name === tableName);
  if (!table) throw Error('Unable to find target table in schema.');

  const fieldType = table.fields.find(tableField => tableField.name === fieldName)
  if (!isExpressionType(fieldType)) throw Error('Unable to determine field type.');
  
  // Esnure that the expression operator is valid.
  if (!isExpressionOperator(field.operator)) {
    throw Error('Invalid expression operator in JSON query.');
  }

  // Esnure that the field value is valid.
  const fieldValue = [field.field_value];
  if (!isValidExpressionValue(fieldType, fieldValue)) {
    throw Error(`Invalid field value for type "${fieldType}" in JSON query.`);
  }
    
  // Create filter node
  const filterNode = FilterNode.create({});

  const expression = createExpressionFromType(fieldType, {
    field: fieldName,
    displayName: fieldName,
    operator: field.operator,
    value: fieldValue,
  });

  filterNode.addExpression(expression)
  return filterNode;
}
