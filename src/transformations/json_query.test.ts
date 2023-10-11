import test from 'ava';
import {insertIntoDefaultSection} from './json_query.js';
import {FilterNode} from '../lib/builder/audience_builder/nodes/filter.js';
import {createAudienceBuilder} from '../builders/audience_builder.js';
import {AudienceBuilderNodeTypes} from '../types/audience_builder/index.js';
import {SectionNode} from '../lib/builder/audience_builder/nodes/section.js';
import {defaultTemplate} from '../lib/builder/audience_builder/templates/default_template.js';

const filters = [FilterNode.create({id: 'test-filter'})];

test('inserts a ndoes into a default section', async t => {
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

  t.truthy(targetSection);
  t.truthy(targetSection?.index);

  t.is(targetSection!.index! - 1, filters[0].index!);
});
