import {createExpressionFromType, FilterNode} from '../nodes/filter.js';
import {HeadingNode} from '../nodes/heading.js';
import {SectionNode} from '../nodes/section.js';
import {TextNode} from '../nodes/text.js';
import {IBuilderTemplate} from '../../../../types/builder.js';
import {
  AudienceBuilderNodeTypes,
  ExpressionTypes,
} from '../../../../types/audience_builder/index.js';
import {DatasetType} from '../../../../types/datasets.js';
import {AudienceBuilder} from '../../../../builders/audience_builder.js';
import {insertNode, addFlexNode} from '../../../../utils/nodes.js';

const DEFAULT_SECTION_TYPES = [
  AudienceBuilderNodeTypes.AUDIENCE,
  AudienceBuilderNodeTypes.FILTER,
  AudienceBuilderNodeTypes.FLEX,
];

const headingContentMap = new Map([
  [AudienceBuilderNodeTypes.AUDIENCE, 'Audiences'],
  [AudienceBuilderNodeTypes.FLEX, 'Transactions & Other Data'],
  [AudienceBuilderNodeTypes.FILTER, 'Customers'],
]);

const subtitleContentMap = new Map([
  [
    AudienceBuilderNodeTypes.AUDIENCE,
    'Include or exclude other audiences you’ve already created.',
  ],
  [
    AudienceBuilderNodeTypes.FILTER,
    'Target your customers by using fields from your data warehouse.',
  ],
  [
    AudienceBuilderNodeTypes.FLEX,
    'Filter your transactions and other data to further segment your audience.',
  ],
]);

export class DefaultTemplate implements IBuilderTemplate {
  get sections(): Map<AudienceBuilderNodeTypes, SectionNode> {
    return new Map([
      [
        AudienceBuilderNodeTypes.AUDIENCE,
        SectionNode.create({
          locked: true,
          defaultNodeType: AudienceBuilderNodeTypes.AUDIENCE,
        }),
      ],
      [
        AudienceBuilderNodeTypes.FILTER,
        SectionNode.create({
          locked: true,
          defaultNodeType: AudienceBuilderNodeTypes.FILTER,
        }),
      ],
    ]);
  }

  get sectionCallbacks(): Map<
    AudienceBuilderNodeTypes,
    (b: AudienceBuilder, s: SectionNode) => void
  > {
    return new Map([
      [
        AudienceBuilderNodeTypes.FLEX,
        (builder: AudienceBuilder, _: SectionNode) => {
          // Makes the primary section default to 'dataset' as its type.
          builder.primarySection.lock();
          builder.primarySection.defaultNodeType =
            AudienceBuilderNodeTypes.FLEX;

          const datasets = builder.datasets.filter(dataset => {
            return dataset.dataset_type !== DatasetType.USER;
          });

          if (!datasets.length) {
            addFlexNode(builder, {}, {index: builder.primarySection.index});
          }
        },
      ],
      [
        AudienceBuilderNodeTypes.FILTER,
        async (
          builder: AudienceBuilder,
          section: SectionNode
        ): Promise<void> => {
          const filters = Array.from(this.createDefaultFilters(builder));
          let previousFilter: undefined | FilterNode;

          for (const filter of filters) {
            const targetIdx = previousFilter
              ? previousFilter.index + 1
              : section.index;

            filter.index = targetIdx;
            await insertNode(builder, filter, targetIdx);
            previousFilter = filter;
          }
        },
      ],
    ]);
  }

  createDefaultFilters(builder: AudienceBuilder): Set<FilterNode> {
    const filters: Set<FilterNode> = new Set();
    const [customerDetails] = builder.datasets.filter(dataset => {
      return dataset.dataset_type === DatasetType.USER;
    });

    if (customerDetails?.default_field_objects) {
      const fieldObjects = customerDetails.default_field_objects
        .map(obj => Object.values(obj))
        .flat();
      for (const field of fieldObjects) {
        const filter = FilterNode.create({});
        const expression = createExpressionFromType(
          field.type as ExpressionTypes,
          {
            field: field.id,
            displayName: field.display_name,
          }
        );
        filter.addExpression(expression);
        filters.add(filter);
      }
    }

    return filters;
  }

  async setup(builder: AudienceBuilder): Promise<void> {
    for (const type of DEFAULT_SECTION_TYPES) {
      // Insert header
      await insertNode(
        builder,
        HeadingNode.create({
          content: headingContentMap.get(type),
          autoFocus: false,
        }),
        builder.primarySection.index
      );
      // Insert subtitle
      await insertNode(
        builder,
        TextNode.create({
          content: subtitleContentMap.get(type),
          autoFocus: false,
        }),
        builder.primarySection.index
      );

      // Insert section, if necessary.
      const section = this.sections.get(type);
      if (section) {
        // Execute section callback, if it exists.
        await insertNode(builder, section, builder.primarySection.index);
        await Promise.resolve(
          this.sectionCallbacks.get(type)?.(builder, section)
        );
      }

      if (type === AudienceBuilderNodeTypes.FLEX) {
        this.sectionCallbacks.get(type)?.(builder, builder.primarySection);
      }
    }
  }
}

export const defaultTemplate = new DefaultTemplate();
