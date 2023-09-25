import {LAYER_ROOT_KEY} from '../../../../constants/audience_builder.js';
import {
  Channel,
  ChannelMessage,
  ChannelMessageTag,
  IChannelMessage,
  IChannelSubscription,
} from '../../../channel.js';
import {
  BuilderStoreNodeFactoryParams,
  IBuilderNode,
  IBuilder,
} from '../../../../types/builder.js';
import {
  AudienceBuilderNodeTypes,
  IAudienceBuilderNode,
  NeighborOperators,
} from '../../../../types/audience_builder/index.js';
import {DatasetType} from '../../../../types/datasets.js';
import {isFilter} from '../../../../utils/audience_builder.js';
import {BuilderEventTags} from '../../index.js';
import {BuilderNode} from '../../node.js';
import {SectionNode} from './section.js';

export enum StemEventTags {
  ADD_CHILD = 'add-child',
  REMOVE_CHILD = 'remove-child',
}

export type StemChildEventPayload<N extends IBuilderNode> = {
  stem: StemNode;
  node: N;
  operator: NeighborOperators;
};

export interface StemMetadata {
  negate: boolean;
  hasFilters: boolean;
  treatAsFilter: boolean;
  nodeTypeConstraint?: AudienceBuilderNodeTypes[];
  operatorConstraint?: NeighborOperators;
  datasetTypeConstraint?: DatasetType;
  nodes: string[];
  [k: string]: unknown;
}

export enum StemUpdateContexts {
  NODE_LIST_UPDATE = 'node-list-update',
  NODE_ADD = 'node-add',
  NODE_REMOVE = 'node-remove',
  NEGATION = 'negation',
}

/**
 * Stem nodes are bare nodes that can themselves contain nodes.
 */
export class StemNode<T extends StemMetadata = StemMetadata>
  extends BuilderNode<T>
  implements IAudienceBuilderNode {
  type = AudienceBuilderNodeTypes.STEM;
  protected nodeIds: Set<string> = new Set();
  datasetTypeConstraint?: DatasetType;
  operatorConstraint: NeighborOperators = NeighborOperators.AND;

  /**
   * Default values, to be overridden by a 'create' factory.
   */
  level = LAYER_ROOT_KEY;
  index = 0;
  negate = false;
  protected nodeTypeConstraint: Set<AudienceBuilderNodeTypes> = new Set();
  protected channel = new Channel(`ab:node:${this.id}`);

  builder?: IBuilder;

  get metadata(): T {
    return {
      negate: this.negate,
      hasFilters: this.hasFilters,
      treatAsFilter: this.treatAsFilter,
      nodeTypeConstraint: Array.from(this.nodeTypeConstraint),
      operatorConstraint: this.operatorConstraint,
      datasetTypeConstraint: this.datasetTypeConstraint,
      nodes: Array.from(this.nodeIds),
    } as T;
  }

  get nodes(): Map<string, IBuilderNode> {
    const nodes = Array.from(this.builder?.cache.nodes.entries() ?? []).filter(
      ([k]) => {
        if (this.nodeIds.has(k)) return true;
        return false;
      }
    );

    return new Map(nodes);
  }

  get hasFilters(): boolean {
    return Array.from(this.nodes.values()).some(node => isFilter(node));
  }

  get treatAsFilter(): boolean {
    return this.nodeTypeConstraint.has(AudienceBuilderNodeTypes.FILTER);
  }

  get nodeList(): IBuilderNode[] {
    return Array.from(this.nodes.values());
  }

  private attachNodeListener(node: IBuilderNode) {
    const changeSubscription: IChannelSubscription = {
      filter: () => true,
      handler: (msg: IChannelMessage) => {
        msg.tags().forEach(tag => {
          switch (tag.key()) {
            case BuilderEventTags.REMOVE_NODE: {
              const node = tag.value() as IBuilderNode;
              if (this.nodeIds.has(node.id)) {
                this.removeNode(node);
              }
              break;
            }
          }
        });
      },
    };

    this.channel.subscribe([changeSubscription]);
    node.addSinkChannel(this.channel);
  }

  isValid(): boolean {
    return true;
  }

  setNodeIds(nodes: string[]) {
    this.nodeIds = new Set(nodes);
  }

  /**
   * Update events are common enough to warrant a unique emission method.
   */
  emitChildEvent<N extends IBuilderNode>(
    event: StemEventTags.REMOVE_CHILD | StemEventTags.ADD_CHILD,
    node: IBuilderNode
  ) {
    const payload = {
      stem: this,
      node: (node as unknown) as N,
      operator: this.operatorConstraint,
    };

    const tag = ChannelMessageTag.create<
      StemEventTags,
      StemChildEventPayload<N>
    >(event, payload);

    const message = ChannelMessage.fromTags([tag]);
    this.emit(message);
  }

  updateNegation(bool: boolean) {
    this.negate = bool;
    this.emitUpdateEvent<StemNode>(StemUpdateContexts.NEGATION);
  }

  addConstraints(constraints: AudienceBuilderNodeTypes[]) {
    this.nodeTypeConstraint = new Set(constraints);
  }

  isValidNode(node: IBuilderNode): boolean {
    return this.nodeTypeConstraint.has(node.type as AudienceBuilderNodeTypes);
  }

  isValidNodeType(type: AudienceBuilderNodeTypes): boolean {
    return this.nodeTypeConstraint.has(type);
  }

  /**
   * Registers node internally with the stem and attaches event
   * handlers.
   */
  registerNode(node: IBuilderNode) {
    if (
      node instanceof SectionNode &&
      !this.canAddSection(node as SectionNode)
    ) {
      console.error("Section node does not meet this stem's constraints.");
      return;
    }

    if (this.nodeIds.has(node.id)) return;

    node.level = this.id;
    this.addNodeId(node.id);
    this.attachNodeListener(node);
    this.emitUpdateEvent<StemNode>(StemUpdateContexts.NODE_ADD);
  }

  /**
   * Registers the given node and dispatches an event for the
   * builder to add the node to the graph.
   */
  addNode<N extends IBuilderNode>(node: IBuilderNode) {
    this.registerNode(node);
    this.emitChildEvent<N>(StemEventTags.ADD_CHILD, node);
  }

  addNodeId(id: string) {
    if (this.nodeIds.has(id)) return;
    this.nodeIds.add(id);
  }

  hasNode(nodeId: string): boolean {
    return this.nodes.has(nodeId);
  }

  getNode(nodeId: string): IBuilderNode | undefined {
    return this.nodes.get(nodeId);
  }

  removeNodeId(id: string) {
    if (!this.nodeIds.has(id)) return;
    this.nodeIds.delete(id);
  }

  removeNode<N extends IBuilderNode>(node: IBuilderNode) {
    this.removeNodeId(node.id);

    this.emitChildEvent<N>(StemEventTags.REMOVE_CHILD, node);
    this.emitUpdateEvent<StemNode>(StemUpdateContexts.NODE_REMOVE);
  }

  private canAddSection(section: SectionNode): boolean {
    const passes = Array.from(this.nodeTypeConstraint).map(type => {
      return section.acceptsNodeType(type);
    });

    return passes.every(x => x);
  }

  static fromStore(params: BuilderStoreNodeFactoryParams): StemNode {
    const node = new StemNode({id: params.id});
    const metadata = params.metadata as StemMetadata;

    node.level = params.level || LAYER_ROOT_KEY;
    node.index = params.index || 0;

    if (metadata.nodes.length) {
      node.setNodeIds(metadata.nodes);
    }

    if (metadata.nodeTypeConstraint) {
      node.addConstraints(metadata.nodeTypeConstraint);
    }

    if (metadata.datasetTypeConstraint) {
      node.datasetTypeConstraint = metadata.datasetTypeConstraint;
    }

    if (metadata.operatorConstraint) {
      node.operatorConstraint = metadata.operatorConstraint;
    }

    if (metadata.negate) {
      node.negate = metadata.negate;
    }

    if (params.tags?.length) {
      node.tags = new Set(params.tags);
    }

    return node;
  }

  static create(
    params: {
      builder?: IBuilder, 
      id?: string;
      level?: string;
      index?: number;
      datasetType?: DatasetType;
      constraints?: Array<AudienceBuilderNodeTypes>;
    } = {}
  ): StemNode {
    const node = new StemNode({id: params.id});
    if (params.builder) node.builder = params.builder;

    node.level = params.level || LAYER_ROOT_KEY;
    node.index = params.index || 0;

    if (params.constraints) {
      node.addConstraints(params.constraints);
    }

    if (params.datasetType) {
      node.datasetTypeConstraint = params.datasetType;
    }

    return node;
  }
}

export class FilterStem extends StemNode {
  protected nodeTypeConstraint: Set<AudienceBuilderNodeTypes> = new Set([
    AudienceBuilderNodeTypes.FILTER,
  ]);

  static create(
    params: {
      builder?: IBuilder, 
      id?: string;
      level?: string;
      index?: number;
      operator?: NeighborOperators;
      datasetType?: DatasetType;
      constraints?: Array<AudienceBuilderNodeTypes>;
    } = {}
  ): FilterStem {
    const node = new FilterStem({id: params.id});
    if (params.builder) node.builder = params.builder;

    node.level = params.level || LAYER_ROOT_KEY;
    node.index = params.index || 0;

    if (params.constraints) {
      node.addConstraints(params.constraints);
    }

    if (params.datasetType) {
      node.datasetTypeConstraint = params.datasetType;
    }

    if (params.operator) {
      node.operatorConstraint = params.operator;
    }

    return node;
  }
}
