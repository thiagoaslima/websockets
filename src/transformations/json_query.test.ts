import test from 'ava';
import {insertIntoDefaultSection} from './json_query.js';
import {FilterNode} from '../lib/builder/audience_builder/nodes/filter.js';
import {createAudienceBuilder} from '../builders/audience_builder.js';
import {AudienceBuilderNodeTypes} from '../types/audience_builder/index.js';
import {SectionNode} from '../lib/builder/audience_builder/nodes/section.js';
import {defaultTemplate} from '../lib/builder/audience_builder/templates/default_template.js';

const FILTER_IDS = ['test-filter-1', 'test-filter-2'] as const;
const filters = FILTER_IDS.map(id => FilterNode.create({id}));

test('inserts two nodes into the default filter section', async t => {
  const builder = createAudienceBuilder();
  await builder.createPrimarySection();

  // Set default template
  builder.setTemplates({default: defaultTemplate});
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
});
