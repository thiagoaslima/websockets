import {
  BuilderEdgeTypes,
  BuilderHierarchicalLevel,
  BuilderHierarchyEntry,
  BuilderQuerySelector,
  IBuilder,
  IBuilderAction,
  IBuilderCtx,
  IBuilderEdge,
  IBuilderNode,
  IBuilderQueryCtx,
  IBuilderStore,
  IBuilderTemplate,
  IBuilderVersion,
} from '../../types/builder.js';
import {
  ChannelMessage,
  ChannelMessageTag,
  IChannel,
  IChannelMessage,
  IChannelSubscription,
} from '../channel.js';
import {SerializedGraph} from 'graphology-types';
import {isString} from '../../utils/predicates.js';
import {SerializedStore} from './stores/graphology.js';
import {BuilderEdge, EdgeEventTags, EdgeUpdatePayload} from './edge.js';
import {BuilderNode, NodeEventTags, NodeUpdatePayload} from './node.js';
import {createEdgeId} from '../../utils/builder.js';
import {BuilderCache} from './cache.js';

export type BuilderConstructorArgs = {
  key: string;
  store: IBuilderStore;
  channel: IChannel;
};

export enum BuilderEventTags {
  INITIALIZED_STORE = 'initialized-store',
  CREATE_NODE = 'create-node',
  PUT_NODE = 'put-node',
  MOVE_NODE = 'move-node',
  PUT_EDGE = 'put-edge',
  PUT_LEVEL = 'put-level',
  REMOVE_NODE = 'remove-node',
  REMOVE_EDGE = 'remove-edge',
}

/**
 * Tag value for node move messages.
 */
export type BuilderMoveNodePayload = {
  node: string;
  level: string;
  index: number;
};

/**
 * Used for deletion of atoms.
 */
export type BuilderRemoveAtomPayload = {
  atomId: string;
};

/**
 * Represents a frozen version of the builder at a given time.
 */
export class BuilderVersion implements IBuilderVersion {
  timestamp: Date;
  store: string;

  private storeRef: IBuilderStore;

  constructor(store: IBuilderStore) {
    this.storeRef = store;
    this.store = store.serialize();
    this.timestamp = new Date();
  }

  compare(version: IBuilderVersion): number {
    if (version.timestamp === this.timestamp && version.store === this.store) {
      return 0;
    }

    if (version.timestamp > this.timestamp) {
      return -1;
    }

    return 1;
  }

  clone(): IBuilderVersion {
    const clone = new BuilderVersion(this.storeRef);
    clone.timestamp = this.timestamp;
    return clone;
  }
}

/**
 * Used by audience edge and node objects to update an
 * audience graph, using an adapter.
 */
export class Builder implements IBuilder {
  protected static HISTORY_LIMIT = 5;

  readonly key: string;
  readonly store: IBuilderStore;
  readonly channel: IChannel;

  cache = new BuilderCache();
  history: IBuilderVersion[] = [];

  protected templates: Map<string, IBuilderTemplate> = new Map();
  private sinks: Map<string, IChannel> = new Map();

  constructor({key, store, channel}: BuilderConstructorArgs) {
    this.key = key;
    this.store = store;
    this.channel = channel;
  }
  protected onEdgeChange(message: IChannelMessage): void {
    for (const tag of message.tags()) {
      switch (tag.key()) {
        case EdgeEventTags.UPDATE: {
          const payload = tag.value() as EdgeUpdatePayload<IBuilderEdge>;
          if (payload.edge) this.putEdge(payload.edge);
        }
      }
    }
  }

  protected onNodeChange(message: IChannelMessage): void {
    for (const tag of message.tags()) {
      switch (tag.key()) {
        case NodeEventTags.UPDATE: {
          const payload = tag.value() as NodeUpdatePayload<IBuilderNode>;
          this.putNode(payload.node);
        }
      }
    }
  }

  get currentVersion(): IBuilderVersion | undefined {
    return this.history[0];
  }

  reset(...args: unknown[]): void {
    throw new Error('Method not implemented.');
  }

  ctx(update?: (ctx: IBuilderCtx) => IBuilderCtx): IBuilderCtx {
    throw new Error('Method not implemented.');
  }

  attachNodeListener(node: IBuilderNode): void {
    if (!node.hasSinkChannel(this.channel.id)) {
      const changeSubscription: IChannelSubscription = {
        filter: () => true,
        handler: this.onNodeChange.bind(this),
      };

      this.channel.subscribe([changeSubscription]);
      node.addSinkChannel(this.channel);
    }
  }

  attachEdgeListener(edge: IBuilderEdge): void {
    if (!edge.hasSinkChannel(this.channel.id)) {
      const changeSubscription: IChannelSubscription = {
        filter: () => true,
        handler: this.onEdgeChange.bind(this),
      };

      this.channel.subscribe([changeSubscription]);
      edge.addSinkChannel(this.channel);
    }
  }

  getNodeFromCache(nodeId: string): IBuilderNode | undefined {
    return this.cache.nodes.get(nodeId);
  }

  getEdgeFromCache(
    source: string,
    target: string,
    type: BuilderEdgeTypes
  ): IBuilderEdge | undefined {
    const id = createEdgeId(source, target, type);
    return this.cache.edges.get(id);
  }

  getEdgeFromCacheByKey(edgeId: string): IBuilderEdge | undefined {
    return this.cache.edges.get(edgeId);
  }

  async putNode(node: IBuilderNode, ctx?: IBuilderQueryCtx): Promise<void> {
    try {
      // Update node Cache.
      this.cache.nodes.set(node.id, node);

      const {data: nodeExists} = await this.store.hasNode(node.id);

      if (nodeExists) {
        const result = await this.store.updateNode<IBuilderNode>(node.id, n => {
          n = node;
          return n;
        });

        if (!result.ok) throw result;

        // TODO: Add proper tag.
        const tag = ChannelMessageTag.create<string, IBuilderNode>(
          BuilderEventTags.PUT_NODE,
          node
        );

        const message = ChannelMessage.fromTags([tag]);
        this.emit(message);
        return;
      }

      const result = await this.store.addNode(node);
      if (!result.ok) throw result;

      // Attaches sink channel if not present.
      this.attachNodeListener(node);

      const tag = ChannelMessageTag.create<string, IBuilderNode>(
        BuilderEventTags.PUT_NODE,
        node
      );

      const message = ChannelMessage.fromTags([tag]);
      this.emit(message);
    } catch (err) {
      console.error(err);
    } finally {
      this.saveVersion();
    }
  }

  getNodes(
    selector: BuilderQuerySelector<IBuilderNode>,
    ctx?: IBuilderQueryCtx
  ): Iterable<IBuilderNode> {
    throw new Error('Method not implemented.');
  }

  async getNode(
    selector: string,
    ctx?: IBuilderQueryCtx
  ): Promise<IBuilderNode | void> {
    try {
      const result = await this.store.getNode(selector);
      if (!result.ok) throw result as Error;

      const node = result.data;

      if (node && !node.hasSinkChannel(this.channel.id)) {
        const changeSubscription: IChannelSubscription = {
          filter: () => true,
          handler: this.onNodeChange.bind(this),
        };

        this.channel.subscribe([changeSubscription]);
        node.addSinkChannel(this.channel);
      }

      return node;
    } catch (err) {
      console.error(err);
    }
  }

  async hasNode(selector: string, ctx?: IBuilderQueryCtx): Promise<boolean> {
    try {
      const result = await this.store.hasNode(selector);
      if (!result.ok) throw result as Error;

      return result.data;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  removeNodes(
    selector: BuilderQuerySelector<IBuilderNode> | Iterable<IBuilderNode>,
    ctx?: IBuilderQueryCtx
  ): void {
    throw new Error('Method not implemented.');
  }

  async removeNode(key: string, ctx?: IBuilderQueryCtx): Promise<void> {
    try {
      const node = this.getNodeFromCache(key);

      const result = await this.store.removeNode(key);
      if (!result.ok) throw result;

      if (node) {
        await this.putLevel(node.level, level => {
          return level.filter(id => id !== node.id);
        });
      }

      // Update edge Cache.
      this.cache.nodes.delete(key);

      const tag = ChannelMessageTag.create<
        BuilderEventTags,
        BuilderRemoveAtomPayload
      >(BuilderEventTags.REMOVE_NODE, {atomId: key});

      this.emit(ChannelMessage.fromTags([tag]));
    } catch (err) {
      console.error(err);
    } finally {
      this.saveVersion();
    }
  }

  async purgeNode(node: IBuilderNode, ctx?: IBuilderQueryCtx): Promise<void> {
    try {
      const level = await this.getLevel(node.id);
      if (level?.length) {
        await Promise.all(level.map(id => this.removeNode(id)));
      }

      await this.removeLevel(node.id);
      await this.removeNode(node.id);
      await this.putLevel(node.level, level => {
        return level.filter(id => id !== node.id);
      });
    } catch (err) {
      console.error(err);
    } finally {
      this.saveVersion();
    }
  }

  async putEdge(edge: IBuilderEdge, ctx?: IBuilderQueryCtx): Promise<void> {
    try {
      // Update edge Cache.
      this.cache.edges.set(edge.id, edge);

      const {data: edgeExists} = await this.store.hasEdge(edge.id);

      if (edgeExists) {
        const result = await this.store.updateEdge<IBuilderEdge>(edge.id, e => {
          e = edge;
          return e;
        });

        if (!result.ok) throw result;

        // Attaches to edge sink channel if not present.
        this.attachEdgeListener(edge);

        // TODO: Add proper tag.
        const tag = ChannelMessageTag.create<string, IBuilderEdge>(
          BuilderEventTags.PUT_EDGE,
          edge
        );

        const message = ChannelMessage.fromTags([tag]);
        this.emit(message);
        return;
      }

      const result = await this.store.addEdge(edge);
      if (!result.ok) throw result;

      // Attaches to edge sink channel if not present.
      this.attachEdgeListener(edge);

      const tag = ChannelMessageTag.create<string, IBuilderEdge>(
        BuilderEventTags.PUT_EDGE,
        edge
      );
      const message = ChannelMessage.fromTags([tag]);
      this.emit(message);
    } catch (err) {
      console.error(err);
    } finally {
      this.saveVersion();
    }
  }

  async hasEdge(
    source: string,
    target: string,
    type: BuilderEdgeTypes
  ): Promise<boolean> {
    try {
      const result = await this.store.hasEdge(
        createEdgeId(source, target, type)
      );
      if (!result.ok) throw Error('Error determining edge existence.');

      return result.data;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  async hasEdgeById(id: string): Promise<boolean> {
    try {
      const result = await this.store.hasEdge(id);
      if (!result.ok) throw Error('Error determining edge existence.');

      return result.data;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  async getEdge(
    source: string,
    target: string,
    type: BuilderEdgeTypes,
    ctx?: IBuilderQueryCtx
  ): Promise<IBuilderEdge | void> {
    try {
      const result = await this.store.getEdge(
        BuilderEdge.createEdgeId(source, target, type)
      );
      if (!result.ok) throw result;

      return result.data;
    } catch (err) {
      console.error(err);
    }
  }

  async getEdgesForNode(
    nodeId: string,
    ctx?: IBuilderQueryCtx
  ): Promise<IBuilderEdge[] | void> {
    try {
      const result = await this.store.getEdgesForNode(nodeId);
      if (!result.ok) throw result;

      return result.data;
    } catch (err) {
      console.error(err);
    }
  }

  getEdges(
    selector: BuilderQuerySelector<IBuilderEdge>,
    ctx?: IBuilderQueryCtx
  ): Iterable<IBuilderEdge> {
    throw new Error('Method not implemented.');
  }

  removeEdges(
    selector: BuilderQuerySelector<IBuilderEdge> | Iterable<IBuilderEdge>,
    ctx?: IBuilderQueryCtx
  ): void {
    throw new Error('Method not implemented.');
  }

  async removeEdge(key: string, ctx?: IBuilderQueryCtx): Promise<void> {
    try {
      const edgeExists = await this.hasEdgeById(key);
      if (!edgeExists) return;

      const result = await this.store.removeEdge(key);
      if (!result.ok) throw result;

      // Update edge Cache.
      this.cache.edges.delete(key);

      const tag = ChannelMessageTag.create<
        BuilderEventTags,
        BuilderRemoveAtomPayload
      >(BuilderEventTags.REMOVE_EDGE, {atomId: key});

      this.emit(ChannelMessage.fromTags([tag]));
    } catch (err) {
      console.error(err);
    } finally {
      this.saveVersion();
    }
  }

  async moveNode(target: IBuilderNode, level: string, index: number) {
    try {
      await this.store.moveNode(target, level, index);

      const tag = ChannelMessageTag.create<
        BuilderEventTags,
        BuilderMoveNodePayload
      >(BuilderEventTags.MOVE_NODE, {
        node: target.id,
        level,
        index,
      });

      this.emit(ChannelMessage.fromTags([tag]));
    } catch (err) {
      console.error(err);
    } finally {
      this.saveVersion();
    }
  }

  async getHierarchy() {
    try {
      const result = await this.store.getHierarchy();
      if (!result.ok) throw Error('Error fetching hierarchy.');

      return result.data;
    } catch (err) {
      console.error(err);
      return;
    }
  }

  async getIndexForNode(nodeId: string) {
    try {
      const node = await this.getNode(nodeId);
      if (!node) throw Error('Error fetching node.');

      return node.index;
    } catch (err) {
      console.error(err);
      return;
    }
  }

  async getLevel(selector: string) {
    try {
      const result = await this.store.getLevel(selector);
      if (!result.ok) throw Error('Error fetching hierarchical level.');

      return result.data;
    } catch (err) {
      console.error(err);
      return;
    }
  }

  async putLevel(
    levelId: string,
    mutation: (level: BuilderHierarchicalLevel) => BuilderHierarchicalLevel,
    ctx?: IBuilderQueryCtx
  ) {
    try {
      let level: BuilderHierarchicalLevel = [];
      const result = await this.store.updateLevel(levelId, currentLevel => {
        currentLevel = level = mutation(currentLevel);
        return currentLevel;
      });

      if (!result.ok) throw result;

      level.forEach(async (nid, idx) => {
        const node = this.getNodeFromCache(nid);
        if (node && idx !== node.index) {
          node.index = idx;
          this.putNode(node).then(() => {
            if (node instanceof BuilderNode) {
              node.emitUpdateEvent('');
            }
          });
        }
      });

      // TODO: Add proper tag.
      const tag = ChannelMessageTag.create<string, BuilderHierarchyEntry>(
        BuilderEventTags.PUT_LEVEL,
        [levelId, level]
      );
      const message = ChannelMessage.fromTags([tag]);
      this.emit(message);
    } catch (err) {
      console.error(err);
    } finally {
      this.saveVersion();
    }
  }

  async removeLevel(selector: string) {
    try {
      const result = await this.store.removeLevel(selector);
      if (!result.ok) throw result;
    } catch (err) {
      console.error(err);
    } finally {
      this.saveVersion();
    }
  }

  dispatch<T, K>(action: IBuilderAction<T>): K | Promise<K> {
    throw new Error('Method not implemented.');
  }

  addSinkChannel(channel: IChannel): void {
    if (this.sinks.has(channel.id)) {
      console.error('Attempted to add a channel that already exists.');
      return;
    }

    this.sinks.set(channel.id, channel);
  }

  removeSinkChannel(channel: string | IChannel): void {
    if (isString(channel)) {
      this.sinks.delete(channel);
      return;
    }

    this.sinks.delete(channel.id);
  }

  emit(message: IChannelMessage): void {
    this.sinks.forEach(channel => {
      channel.publish(message);
    });
  }

  graphJSON(): string {
    return this.store.serialize();
  }

  async initializeStore(
    store: SerializedStore,
    cb?: (node: IBuilderNode) => void
  ): Promise<void> {
    this.store.init(store);

    await this.store.traverse((node: IBuilderNode) => {
      this.cache.nodes.set(node.id, node);
      this.attachNodeListener(node);
    });

    await this.store.traverse(async (node: IBuilderNode) => {
      const edges = await this.store.getEdgesForNode(node.id);
      if (!edges.ok) throw Error('Error during initialization.');
      edges.data.forEach(e => {
        this.cache.edges.set(e.id, e);
        this.attachEdgeListener(e);
      });
    });

    if (cb) this.store.traverse(cb);

    const tag = ChannelMessageTag.create<string, null>(
      BuilderEventTags.INITIALIZED_STORE,
      null
    );
    const message = ChannelMessage.fromTags([tag]);
    this.emit(message);
  }

  initializeGraph<T extends SerializedGraph = SerializedGraph>(graph: T): void {
    this.store.init(graph);
  }

  registerTemplate(key: string, template: IBuilderTemplate) {
    this.templates.set(key, template);
  }

  setTemplates(templates: Record<string, IBuilderTemplate>) {
    for (const [key, template] of Object.entries(templates)) {
      this.templates.set(key, template);
    }
  }

  async useTemplate(key: string): Promise<void> {
    try {
      const template = this.templates.get(key);
      if (!template) throw Error('Invalid template');
      await template.setup(this);
      template.completed?.(this);
    } catch (err) {
      console.error('TemplateError:', err);
    }
  }

  saveVersion(): void {
    const newVersion = new BuilderVersion(this.store);

    // Skip saving the version if previous version is identical.
    if (newVersion.store === this.currentVersion?.store) return;

    if (this.history.length >= Builder.HISTORY_LIMIT) {
      this.history = [
        newVersion,
        ...this.history.slice(0, Builder.HISTORY_LIMIT - 1),
      ];
      return;
    }

    this.history = [newVersion, ...this.history];
  }
}
