import test from 'ava';
import {insertIntoDefaultSection, transform} from './json_query.js';
import {FilterNode} from '../lib/builder/audience_builder/nodes/filter.js';
import {createAudienceBuilder} from '../builders/audience_builder.js';
import {AudienceBuilderNodeTypes} from '../types/audience_builder/index.js';
import {SectionNode} from '../lib/builder/audience_builder/nodes/section.js';
import {defaultTemplate} from '../lib/builder/audience_builder/templates/default_template.js';
import {multiFilterJSONQuery} from '../common/tests/factories/json_query.js';
import {schemaResponse} from '../common/tests/factories/quervice.js';
import {JSONQuery} from '../types/json_query.js';
import {
  JSONQueryOperatorToExpressionOperator,
  getFieldType,
  getFieldValue,
  isNodeFilterMap,
} from '../utils/json_query.js';

const FILTER_IDS = ['test-filter-1', 'test-filter-2'] as const;
const filters = FILTER_IDS.map(id => FilterNode.create({id}));

test('inserts two nodes into the default filter section', async t => {
  try {
    const builder = createAudienceBuilder();
    await builder.createPrimarySection();

    // Set default template
    builder.setTemplates({default: defaultTemplate()});
    await builder.useTemplate('default');

    await insertIntoDefaultSection(
      builder,
      AudienceBuilderNodeTypes.FILTER,
      filters
    );

    const targetSection = builder.findNode(node => {
      if (node instanceof SectionNode) {
        return node.defaultNodeType === AudienceBuilderNodeTypes.FILTER;
      }

      return false;
    });

    // Ensure the target section exists
    t.truthy(targetSection);
    // Ensure the target section has an index
    t.truthy(targetSection?.index);

    // Ensure that filters were added in the right order.
    filters.forEach((filter, index) => {
      const target = builder.findNode(node => node.id === filter.id);
      // Ensures that the target is actually in the graph.
      t.truthy(target);
      t.is(targetSection!.index! - (filters.length - index), filter.index!);
    });
  } catch (err) {
    console.error(err);
  }
});

test('it should generate a valid builder from a given JSON query', async t => {
  const builder = await transform(multiFilterJSONQuery, schemaResponse);
  const graphJSON = builder.graphJSON();

  const jsonQuery: JSONQuery = JSON.parse(multiFilterJSONQuery);

  const queryFilters = isNodeFilterMap(jsonQuery.queries.base_query['filter'])
    ? jsonQuery.queries.base_query['filter'].and
    : [];
  const expressionMaps = Array.from(builder.cache.nodes.values())
    .filter(value => value instanceof FilterNode)
    .map(node => (node as FilterNode).expressions);

  t.is(typeof graphJSON, 'string');
  t.assert(queryFilters.length === expressionMaps.length);

  const expressionArrays = expressionMaps.map(expressions =>
    Array.from(expressions.values())
  );

  expressionArrays.flat().forEach(expression =>
    queryFilters.forEach(queryFilter => {
      if (expression.field === queryFilter.field_name) {
        const fieldType = getFieldType(queryFilter, schemaResponse);
        const expressionOperator = JSONQueryOperatorToExpressionOperator(
          queryFilter.operator
        );

        t.assert(expression.displayName === queryFilter.field_name);
        t.assert(expression.operator === expressionOperator);
        t.assert(expression.value === getFieldValue(queryFilter, fieldType));
      }
    })
  );
});
