import {
  BuilderHierarchicalLevel,
  BuilderHierarchy,
  EdgeClassType,
  IBuilderAtomTypes,
  IBuilderEdge,
  IBuilderNode,
  IBuilderStore,
  IBuilderStoreMutation,
  NodeClassType,
} from '../../../types/builder.js';
import {ClassType} from '../../../types/classes.js';
import {Result, ResultOk, ResultErr} from '../../result.js';
import Graph from 'graphology';
import {bfs} from 'graphology-traversal';
import {GraphOptions, SerializedGraph} from 'graphology-types';
import {isPlainObject, isString} from '../../../utils/predicates.js';
import {hasProperty} from '../../../utils/objects.js';

const GRAPH_TYPE = 'directed';
const GRAPH_VERSION = '0.0.1';

const graphOptions: GraphOptions = Object.freeze({
  allowSelfLoops: false,
  type: GRAPH_TYPE,
});

/**
 * Base node attributes interface to be implemented by particular nodes.
 */
export interface GraphologyNodeAttributes {
  type: string;
  level: string;
  index: number;
  tags: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Base edge attributes interface to be implemented by particular edges.
 */
export interface GraphologyEdgeAttributes {
  type: string;
  metadata?: Record<string, unknown>;
}

export type GraphologyFactoryParams = {
  store?: SerializedStore;
  config: GraphologyConfig;
  metadata?: Record<string, unknown>;
};

export type GraphologyConfig = {
  nodeClassMap: Map<string, ClassType<IBuilderNode>>;
  edgeClassMap: Map<string, ClassType<IBuilderEdge>>;
};

export interface SerializedStore {
  version: string;
  hierarchy: Record<string, string[]>;
  graph: SerializedGraph;
  metadata: Record<string, unknown>;
}

const REQUIRED_STORE_PROPERTIES = ['graph', 'hierarchy', 'metadata', 'version'];
const MISSING_GRAPH_PROPERTIES = ['attributes', 'edges', 'nodes', 'options'];

export function isSerializedStore(value: unknown): value is SerializedStore {
  if (!isPlainObject(value)) return false;

  const hasRequiredStoreProps = REQUIRED_STORE_PROPERTIES.every(prop =>
    hasProperty(value, prop)
  );

  if (!hasRequiredStoreProps) return false;

  return MISSING_GRAPH_PROPERTIES.every(prop => hasProperty(value.graph, prop));
}

export function parseSerializedStore(
  storeString?: string
): SerializedStore | undefined {
  if (!storeString) return;
  try {
    const store = JSON.parse(storeString);
    if (!isSerializedStore(store)) {
      throw new Error('Trying to parse an invalid serialized store.');
    }
    return store;
  } catch (error: unknown) {
    const message = hasProperty(error, 'message')
      ? error.message
      : 'Invalid serialized store';
    const data = hasProperty(error, 'message') ? storeString : error;
    console.error(message, data);
    return;
  }
}

export class GraphologyStore implements IBuilderStore {
  graph: Graph = new Graph(graphOptions);

  readonly version = GRAPH_VERSION;
  metadata = {};

  private initialCache?: SerializedGraph;
  private nodeClassMap: Map<string, ClassType<IBuilderNode>>;
  private edgeClassMap: Map<string, ClassType<IBuilderEdge>>;

  private hierarchy: BuilderHierarchy = new Map();

  private constructor(config: GraphologyConfig) {
    this.nodeClassMap = config.nodeClassMap;
    this.edgeClassMap = config.edgeClassMap;
  }

  /**
   * Used as a basis for hasNode and hasEdge.
   */
  private has(type: IBuilderAtomTypes, atomId: string) {
    switch (type) {
      case IBuilderAtomTypes.NODE:
        return this.graph.hasNode(atomId);
      case IBuilderAtomTypes.EDGE:
        return this.graph.hasEdge(atomId);
      default:
        return false;
    }
  }

  /**
   * Used as a basis for removeNode and removeEdge.
   */
  private remove(type: IBuilderAtomTypes, atomId: string): void {
    switch (type) {
      case IBuilderAtomTypes.NODE:
        if (this.graph.hasNode(atomId)) {
          this.graph.dropNode(atomId);
        }
        break;
      case IBuilderAtomTypes.EDGE:
        if (this.graph.hasEdge(atomId)) {
          this.graph.dropEdge(atomId);
        }
        break;
      default:
        console.error('[store:remove] Invalid atom type.', type);
        break;
    }
  }

  /**
   * Initializes the Graphology store, importing a serialized graph if provided as
   * a starting point.
   */
  init(serializedStore?: SerializedStore) {
    if (serializedStore) {
      this.hierarchy = new Map(Object.entries(serializedStore.hierarchy));
      this.graph.import(serializedStore.graph);
      this.initialCache = serializedStore.graph;
    }
  }

  /**
   * A method implementing IDecoder to be used when marshalling nodes into Graphology attributes.
   */
  nodeEncoder<T extends IBuilderNode>(node: T): GraphologyNodeAttributes {
    const attributes: GraphologyNodeAttributes = {
      type: node.type,
      level: node.level,
      index: node.index,
      tags: Array.from(node.tags),
      metadata: node.metadata,
    };

    return attributes;
  }

  /**
   * A method implementing IDecoder to be used when unmarshalling node attributes.
   */
  nodeDecoder<T extends IBuilderNode>(_: GraphologyNodeAttributes): T {
    throw Error('Method not implemented');
  }

  /**
   * A method implementing IDecoder to be used when marshalling edges into Graphology attributes.
   */
  edgeEncoder<T extends IBuilderEdge>(edge: T): GraphologyEdgeAttributes {
    const attributes: GraphologyEdgeAttributes = {
      type: edge.type,
      metadata: edge.metadata,
    };

    return attributes;
  }

  /**
   * A method implementing IDecoder to be used when unmarshalling edge attributes.
   */
  edgeDecoder<T extends IBuilderEdge>(
    _edgeAttributes: GraphologyEdgeAttributes
  ): T {
    throw Error('Method not implemented');
  }

  /**
   * Creates an empty BuilderNode instance using the provided generic and type key.
   */
  createNode<T extends IBuilderNode>(
    id: string,
    attrs: GraphologyNodeAttributes
  ): Result<T> {
    const targetClass = this.nodeClassMap.get(attrs.type) as NodeClassType<T>;
    if (!targetClass) {
      return ResultErr.create('Invalid node type');
    }

    if (targetClass.fromStore && attrs.metadata) {
      const params = {
        id,
        index: attrs.index,
        level: attrs.level,
        tags: attrs.tags,
        metadata: attrs.metadata || {},
      };

      return ResultOk.create<T>(targetClass.fromStore(params) as T);
    }

    return ResultOk.create<T>(new targetClass({id}) as T);
  }

  /**
   * Creates an empty BuilderEdge instance using the provided generic and type key.
   */
  createEdge<T extends IBuilderEdge>(
    id: string,
    source: string,
    target: string,
    attrs: GraphologyEdgeAttributes
  ): Result<T> {
    const targetClass = this.edgeClassMap.get(attrs.type) as EdgeClassType<T>;
    if (!targetClass) {
      return ResultErr.create(
        `Invalid edge type (or missing class map entry for): ${
          attrs.type || 'undefined'
        }`
      );
    }

    if (targetClass.fromStore && attrs.metadata) {
      return ResultOk.create<T>(
        targetClass.fromStore({
          source,
          target,
          metadata: attrs.metadata || {},
        }) as T
      );
    }

    return ResultOk.create<T>(
      new targetClass({
        id,
        source,
        target,
      }) as T
    );
  }

  hasNode(atomId: string): Promise<Result<boolean>> {
    const result = ResultOk.create<boolean>(
      this.has(IBuilderAtomTypes.NODE, atomId)
    );

    return Promise.resolve(result);
  }

  hasEdge(atomId: string): Promise<Result<boolean>> {
    const result = ResultOk.create<boolean>(
      this.has(IBuilderAtomTypes.EDGE, atomId)
    );

    return Promise.resolve(result);
  }

  getNode<T extends IBuilderNode>(atomId: string): Promise<Result<T>> {
    if (!this.has(IBuilderAtomTypes.NODE, atomId)) {
      throw Error('Unable to find target atom.');
    }

    const nodeAttributes = this.graph.getNodeAttributes(
      atomId
    ) as GraphologyNodeAttributes;

    const result = this.createNode<T>(atomId, nodeAttributes);

    if (!result.ok || !result) {
      return Promise.reject(
        result instanceof ResultErr
          ? result
          : ResultErr.create('Error creating builder node.')
      );
    }

    return Promise.resolve(result);
  }

  getEdge<T extends IBuilderEdge>(atomId: string): Promise<Result<T>> {
    if (!this.has(IBuilderAtomTypes.EDGE, atomId)) {
      throw Error('Unable to find target atom.');
    }

    const source = this.graph.source(atomId);
    const target = this.graph.source(atomId);
    const edgeAttributes = this.graph.getEdgeAttributes(
      atomId
    ) as GraphologyEdgeAttributes;

    const result = this.createEdge<T>(atomId, source, target, edgeAttributes);

    if (!result.ok || !result) {
      return Promise.reject(
        result instanceof ResultErr
          ? result
          : ResultErr.create('Error creating builder edge.')
      );
    }

    return Promise.resolve(result);
  }

  async addNode(node: IBuilderNode) {
    try {
      const serialized = node.serialize<GraphologyNodeAttributes>({
        encode: this.nodeEncoder,
      });

      this.graph.addNode(node.id, serialized);

      return ResultOk.create(null);
    } catch (err) {
      return ResultErr.create(
        isString(err) ? err : 'Unable to add node using store.'
      );
    }
  }

  addEdge(edge: IBuilderEdge) {
    const serialized = edge.serialize<GraphologyEdgeAttributes>({
      encode: this.edgeEncoder,
    });

    this.graph.addEdgeWithKey(
      edge.id,
      edge.source(),
      edge.target(),
      serialized
    );

    return Promise.resolve(ResultOk.create(null));
  }

  async updateNode<N extends IBuilderNode>(
    atomId: string,
    mutation: IBuilderStoreMutation<N>
  ) {
    try {
      const result = await this.getNode<N>(atomId);
      if (result.nil() || !result.ok) throw result as ResultErr;

      const node = mutation(result.data);
      const serialized = await node.serialize<GraphologyNodeAttributes>({
        encode: this.nodeEncoder,
      });

      this.graph.updateNode(atomId, (attributes: object) => {
        return {...attributes, ...serialized};
      });

      return Promise.resolve(ResultOk.create(null));
    } catch (err) {
      return Promise.reject(
        err instanceof ResultErr
          ? err
          : ResultErr.create('Unable to update node.')
      );
    }
  }

  async updateEdge<E extends IBuilderEdge>(
    atomId: string,
    mutation: IBuilderStoreMutation<E>
  ) {
    try {
      const result = await this.getEdge<E>(atomId);
      if (result.nil() || !result.ok) throw result as ResultErr;

      const edge = mutation(result.data);
      const serialized = await edge.serialize<GraphologyEdgeAttributes>({
        encode: this.edgeEncoder,
      });

      this.graph.updateEdge(
        edge.source(),
        edge.target(),
        (attributes: object) => {
          return {...attributes, ...serialized};
        }
      );

      return Promise.resolve(ResultOk.create(null));
    } catch (err) {
      return Promise.reject(
        err instanceof ResultErr
          ? err
          : ResultErr.create('Unable to update edge.')
      );
    }
  }

  removeNode(atomId: string) {
    this.remove(IBuilderAtomTypes.NODE, atomId);
    return Promise.resolve(ResultOk.create(null));
  }

  removeEdge(atomId: string) {
    this.remove(IBuilderAtomTypes.EDGE, atomId);
    return Promise.resolve(ResultOk.create(null));
  }

  getHierarchy() {
    return Promise.resolve(ResultOk.create(this.hierarchy));
  }

  getLevel(levelId: string) {
    if (!this.hierarchy.has(levelId)) {
      this.hierarchy.set(levelId, []);
    }

    const level = this.hierarchy.get(levelId) as BuilderHierarchicalLevel;
    return Promise.resolve(ResultOk.create(level));
  }

  updateLevel(
    levelId: string,
    mutationFn: (level: BuilderHierarchicalLevel) => BuilderHierarchicalLevel
  ) {
    if (!this.hierarchy.has(levelId)) {
      return Promise.reject(ResultErr.create('No level by that ID'));
    }

    const level = this.hierarchy.get(levelId) as BuilderHierarchicalLevel;
    this.hierarchy.set(levelId, mutationFn(level));

    return Promise.resolve(ResultOk.create(null));
  }

  removeLevel(levelId: string) {
    if (!this.hierarchy.has(levelId)) {
      return Promise.reject(ResultErr.create('No level by that ID'));
    }

    this.hierarchy.delete(levelId);
    return Promise.resolve(ResultOk.create(null));
  }

  moveNode(_node: IBuilderNode, _level: string, _index: number) {
    /**
     * TODO: To be implemented when needed. Should:
     *  * Handle edge deletion, creation, etc.
     *  * Update node cache.
     *  * Update node hierarchy.
     */
    return Promise.reject(ResultErr.create('Method not implemented'));
  }

  getEdgesForNode<E extends IBuilderEdge>(
    atomId: string
  ): Promise<Result<E[]>> {
    if (!this.has(IBuilderAtomTypes.NODE, atomId)) {
      throw Error('Unable to find target atom.');
    }

    const edgeAttributes = this.graph.edges(atomId).map((e: string) => {
      const attrs = {
        key: e,
        ...this.graph.getEdgeAttributes(e),
      };

      return attrs as GraphologyEdgeAttributes & {key: string};
    });

    const results: E[] = [];
    for (const attrs of edgeAttributes) {
      const result = this.createEdge<E>(
        attrs.key,
        this.graph.source(attrs.key),
        this.graph.target(attrs.key),
        attrs
      );

      if (!result.ok || !result) {
        return Promise.reject(
          result instanceof ResultErr
            ? result
            : ResultErr.create('Error creating builder edge.')
        );
      }

      results.push(result.data);
    }

    return Promise.resolve(ResultOk.create(results));
  }

  traverse<T = unknown>(cb: (node: IBuilderNode) => T): T | void {
    let returnValue: T | undefined;

    bfs(this.graph, (id, attrs, _depth) => {
      const result = this.createNode(id, attrs as GraphologyNodeAttributes);
      if (!result.ok) throw Error('Failed to create node object.');

      const node = result.data;
      const cbReturn = cb(node);

      if (cbReturn) {
        returnValue = cbReturn;
        // According to the graphology docs, returning true kills traversal.
        return true;
      }

      return;
    });

    return returnValue;
  }

  clear() {
    this.graph.clear();
  }

  reset() {
    if (this.initialCache) {
      this.clear();
      this.graph.import(this.initialCache);
    }
  }

  save() {
    // TODO(joshua): Replace with in memory Redis store
    // const _jsonGraph = this.serialize();
    //localStorage.setItem(GRAPH_STORE_KEY, jsonGraph);
  }

  load() {
    if (this.graph.size !== 0) return;

    // TODO(joshua): Replace with in memory Redis store
    // const localGraph = localStorage.getItem(GRAPH_STORE_KEY);
    // if (!localGraph) return;
    //
    // const serialized = this.deserialize(localGraph);
    // this.init(serialized);
  }

  serialize(): string {
    const graph = this.graph.export();
    const store: SerializedStore = {
      version: GRAPH_VERSION,
      hierarchy: Object.fromEntries(this.hierarchy.entries()),
      graph,
      metadata: this.metadata,
    };

    return JSON.stringify(store);
  }

  export<T extends SerializedStore = SerializedStore>(): T {
    const graph = this.graph.export();
    const store: SerializedStore = {
      version: GRAPH_VERSION,
      hierarchy: Object.fromEntries(this.hierarchy.entries()),
      graph,
      metadata: this.metadata,
    };

    return store as T;
  }

  deserialize<T extends SerializedStore = SerializedStore>(json: string): T {
    const parsedJSON = JSON.parse(json);

    return parsedJSON as T;
  }

  /**
   * Creates and initializes a Graphology store.
   */
  static create({
    store,
    config,
    metadata,
  }: GraphologyFactoryParams): GraphologyStore {
    const graph = new GraphologyStore(config);
    if (metadata) graph.metadata = metadata;
    graph.init(store);
    return graph;
  }
}
