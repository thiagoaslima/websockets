import {JSONQuery} from '../types/json_query.js';
import {createAudienceBuilder, AudienceBuilder} from '../builders/audience_builder.js';
import {defaultTemplate} from '../lib/builder/audience_builder/templates/default_template.js';
import {insertNode} from '../utils/nodes.js';
import {AudienceBuilderNodeTypes} from '../types/audience_builder/index.js';
import {FullSchemaResponse} from '../types/schemas.js';
import {isJSONQueryField, isNodeFilterMap, queryFieldToFilterNode} from '../utils/json_query.js';
import {IBuilderNode} from '../types/builder.js';


export type DefaultTemplateSection = 
  | AudienceBuilderNodeTypes.AUDIENCE
  | AudienceBuilderNodeTypes.FILTER
  | AudienceBuilderNodeTypes.FLEX;


/**
 * Inserts nodes into section of audience builder
 * @param builder AudienceBuilder
 * @param defaultSection Section
 * @param nodes Nodes to be inserted into section
 */
export async function insertIntoDefaultSection(
  builder: AudienceBuilder,
  defaultSection: DefaultTemplateSection,
  nodes: IBuilderNode[],
): Promise<void> {
   const section = defaultSection === AudienceBuilderNodeTypes.FLEX
     ? builder.primarySection!
     : defaultTemplate.sections.get(defaultSection);
   
   if (!section) throw Error('Invalid section type.');
   
    let previousNode: undefined | IBuilderNode;
    for (const node of nodes) {
      const targetIdx = previousNode
        ? previousNode.index + 1
        : section.index;

      node.index = targetIdx;
      await insertNode(builder, node, targetIdx);
      previousNode = node;
    }
}


/**
 * Tranforms JSON query to graph
 * @param data JSON query string
 * @param schema FullSchemaResponse object
 * @returns graph object
 */
export async function transform(data: string, schema: FullSchemaResponse) {
    
    const jsonQuery: JSONQuery = JSON.parse(data);
    const builder = createAudienceBuilder();
    await builder.createPrimarySection();
    
    // Set default template
    builder.setTemplates({default: defaultTemplate});
    builder.useTemplate('default');

    const queries = jsonQuery.queries;
    const nodeFilters = queries['base_query']['filter'];

    // Get node filters
    const filters = isNodeFilterMap(nodeFilters)
                    ? nodeFilters
                        .and
                        .filter(field => isJSONQueryField(field))
                        .map(field => queryFieldToFilterNode(field, schema))
                    : [];

    // Insert filter nodes into section
    await insertIntoDefaultSection(builder, AudienceBuilderNodeTypes.FILTER, filters);

    return builder;
}
