import {AudienceBuilderNodeTypes, IAudienceBuilderNode, NeighborOperators} from '../types/audience_builder/index.js';
import {DatasetType, FlexDatasets} from '../types/datasets.js';
import {IBuilder, IBuilderNode, BuilderEdgeTypes} from '../types/builder.js';
import {LAYER_ROOT_KEY} from '../constants/audience_builder.js';
import {NeighborEdge} from '../lib/builder/audience_builder/edges/neighbor.js';
import {ChildEdge} from '../lib/builder/audience_builder/edges/child.js';
import {isFilter} from './audience_builder.js';
import {AggregateExpression, FlexNode} from '../lib/builder/audience_builder/nodes/flex_filter.js';
import {SectionNode} from '../lib/builder/audience_builder/nodes/section.js';


export const DEFAULT_MUTATION_PARAMS = {};

export function isAudienceBuilderNode(
    node: IBuilderNode
  ): node is IAudienceBuilderNode & IBuilderNode {
    return ((node as unknown) as IAudienceBuilderNode).isValid !== undefined;
  }

export function defaultOperatorForType(
    type: AudienceBuilderNodeTypes
  ): NeighborOperators | undefined {
    switch (type) {
      case AudienceBuilderNodeTypes.FLEX:
      case AudienceBuilderNodeTypes.STEM:
      case AudienceBuilderNodeTypes.FILTER:
        return NeighborOperators.AND;
      case AudienceBuilderNodeTypes.AUDIENCE:
        return NeighborOperators.AND_NOT;
    }
  }

export type AudienceBuilderMutationParams = {
    operator?: NeighborOperators;
    datasetType?: DatasetType;
    level?: string;
    index?: number;
  };

type Neighbors = {
    left: string;
    right: string;
};

export async function getTargetNeighbors(builder: IBuilder, node: IBuilderNode): Promise<Neighbors> {
    const level = await builder.getLevel(node.level);
    if (!level) throw Error('Invalid level for node.');

    return {
      left: level[node.index - 1],
      right: level[node.index],
    };
  }

export async function putNeighborNode(
    builder: IBuilder,
    node: IBuilderNode,
    params: AudienceBuilderMutationParams = DEFAULT_MUTATION_PARAMS
  ): Promise<void> {
    try {
      await builder.putNode(node, {runInsightsRequest: false});
      const neighbors = await getTargetNeighbors(builder, node);

      if (neighbors.left) {
        const edge = NeighborEdge.create(neighbors.left, node.id, builder);
        const neighbor = builder.getNodeFromCache(neighbors.left);
        if (!neighbor) throw Error('Invalid node id within hierarchy');

        if (isFilter(neighbor) && isFilter(node)) {
          edge.operator =
            params.operator ||
            defaultOperatorForType(node.type as AudienceBuilderNodeTypes);
        }

        await builder.putEdge(edge);
      }

      if (neighbors.right) {
        const edge = NeighborEdge.create(node.id, neighbors.right, builder);
        const neighbor = builder.getNodeFromCache(neighbors.right);
        if (!neighbor) throw Error('Invalid node id within hierarchy');

        if (isFilter(neighbor) && isFilter(node)) {
          edge.operator =
            params.operator ||
            defaultOperatorForType(neighbor.type as AudienceBuilderNodeTypes);
        }

        await builder.putEdge(edge);
      }

      await builder.putLevel(node.level, level => {
        level.splice(node.index, 0, node.id);
        return level;
      });

    } catch (err) {
      console.error(err);
    }
  }

export async function insertNode(
    builder: IBuilder,
    node: IBuilderNode,
    index: number,
    params: AudienceBuilderMutationParams = DEFAULT_MUTATION_PARAMS
  ): Promise<void> {
    try {
      node.index = index;
      await putNeighborNode(builder, node, params);

      const isValidChild =
        node.level === LAYER_ROOT_KEY ||
        (await builder.hasEdge(node.level, node.id, BuilderEdgeTypes.CHILD));

      if (!isValidChild) {
        const edge = ChildEdge.create(node.level, node.id, builder);
        await builder.putEdge(edge);
      }
    } catch (err) {
      console.error(err);
    }
}

export async function pushNode(
    builder: IBuilder,
    node: IBuilderNode,
    params: AudienceBuilderMutationParams = DEFAULT_MUTATION_PARAMS
  ): Promise<void> {
    try {
      const level = await builder.getLevel(node.level);
      if (!level) throw Error('Invalid node level.');
      await insertNode(builder, node, level.length, params);
    } catch (err) {
      console.error(err);
    }
}

export async function addChildNode(
    builder: IBuilder,
    parentKey: string,
    child: IBuilderNode,
    params: AudienceBuilderMutationParams = DEFAULT_MUTATION_PARAMS
  ) {
    try {
      if (child.level !== parentKey) {
        throw Error('Child level is not set to its parent.');
      }

      await insertNode(builder, child, child.index, params);
    } catch (err) {
      console.error(err);
    }
  }

export async function addFlexNode(
    builder: IBuilder,
    {
      expression,
      datasetId,
    }: {
      expression?: AggregateExpression;
      datasetId?: number;
    },
    params: AudienceBuilderMutationParams = DEFAULT_MUTATION_PARAMS
  ): Promise<FlexNode | undefined> {
    try {
      const node = FlexNode.create({
        builder: builder,
        expression,
        datasetId,
        datasetType: params.datasetType as FlexDatasets | undefined,
        level: params.level,
        index: params.index,
        operator: params.operator,
      });
      const section = SectionNode.create({
        level: node.id,
        datasetTypeConstraint: expression?.datasetType || params.datasetType,
        typeConstraints: [AudienceBuilderNodeTypes.FILTER],
      });

      // Makes the section primary for the stem.
      section.makePrimary();

      await insertNode(builder, node, node.index, params);
      await addChildNode(builder, node.id, section);

      return node;
    } catch (err) {
      console.error();
    }
  }
