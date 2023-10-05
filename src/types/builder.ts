import {IChannel, IChannelMessage} from '../lib/channel.js';
import {Result} from '../lib/result.js';

export type BuilderQuerySelector<T> =
  | Iterable<string>
  | {
      predicate: (item: string | T) => boolean;
    }
  | {
      resolver: (items: Iterable<string> | Iterable<T>) => Iterable<T>;
    };

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IBuilderCtx {}

export interface IBuilderAction<T> {
  execute(): T | Promise<T>;
  cancel(): boolean;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IBuilderQueryCtx {}

export interface IBuilderCache {
  nodes: Map<string, IBuilderNode>;
  edges: Map<string, IBuilderEdge>;
}

export interface IBuilderVersion {
  timestamp: Date;
  store: string;
  /**
   * Compare another version with this verion.
   *   - Should return 0 if the versions are identical.
   *   - Should return 1 if the current version is newer.
   *   - Should return -1 if the the current version is older.
   */
  compare(version: IBuilderVersion): number;
  /**
   * Creates a clone of the current version.
   */
  clone(): IBuilderVersion;
}

/**
 * Object definition for a builder.
 */
export interface IBuilder {
  // Cache for nodes and edges.
  cache: IBuilderCache;
  // Internal version history.
  history: IBuilderVersion[];
  getNodeFromCache(nodeId: string): IBuilderNode | undefined;
  getEdgeFromCache(
    source: string,
    target: string,
    type: BuilderEdgeTypes
  ): IBuilderEdge | undefined;
  getEdgeFromCacheByKey(edgeId: string): IBuilderEdge | undefined;

  /** to add or update a node */
  putNode(node: IBuilderNode, ctx?: IBuilderQueryCtx): void;
  getNodes(
    selector: BuilderQuerySelector<IBuilderNode>,
    ctx?: IBuilderQueryCtx
  ): Iterable<IBuilderNode>;
  getNode(
    selector: BuilderQuerySelector<IBuilderNode>,
    ctx?: IBuilderQueryCtx
  ): Promise<IBuilderNode | void>;
  hasNode(selector: string, ctx?: IBuilderQueryCtx): Promise<boolean>;
  removeNodes(
    selector: Iterable<IBuilderNode> | BuilderQuerySelector<IBuilderNode>,
    ctx?: IBuilderQueryCtx
  ): void;
  purgeNode(node: IBuilderNode, ctx?: IBuilderQueryCtx): Promise<void>;

  putEdge(edge: IBuilderEdge, ctx?: IBuilderQueryCtx): void;
  hasEdge(
    source: string,
    target: string,
    type: BuilderEdgeTypes,
    ctx?: IBuilderQueryCtx
  ): Promise<boolean>;
  getEdge(
    source: string,
    target: string,
    type: BuilderEdgeTypes,
    ctx?: IBuilderQueryCtx
  ): Promise<IBuilderEdge | void>;
  getEdges(
    selector: BuilderQuerySelector<IBuilderEdge>,
    ctx?: IBuilderQueryCtx
  ): Iterable<IBuilderEdge>;
  getEdgesForNode(
    nodeId: string,
    ctx?: IBuilderQueryCtx
  ): Promise<Iterable<IBuilderEdge> | void>;
  removeEdges(
    selector: Iterable<IBuilderEdge> | BuilderQuerySelector<IBuilderEdge>,
    ctx?: IBuilderQueryCtx
  ): void;

  /**
   * Retrieves a map fo the current node hierarchy.
   */
  getHierarchy(ctx?: IBuilderQueryCtx): Promise<BuilderHierarchy | void>;
  /**
   * Returns a hierachical level given a root key or node UUID.
   */
  getLevel(
    selector: string,
    ctx?: IBuilderQueryCtx
  ): Promise<BuilderHierarchicalLevel | void>;
  /**
   * Updates a hierarchical level in the hierarchy map to _exactly_ what's
   * provided.
   */
  putLevel(
    levelId: string,
    mutation: (level: BuilderHierarchicalLevel) => BuilderHierarchicalLevel,
    ctx?: IBuilderQueryCtx
  ): Promise<void>;
  /**
   * Removes a hierarchical level given a root or node UUID.
   */
  removeLevel(selector: string, ctx?: IBuilderQueryCtx): Promise<void>;

  /**
   * Moves node from one level/index to another level/index.
   */
  moveNode(
    target: IBuilderNode,
    level: string,
    index: number,
    ctx?: IBuilderQueryCtx
  ): Promise<void>;

  dispatch<T, K>(action: IBuilderAction<T>): K | Promise<K>;

  addSinkChannel(channel: IChannel): void;
  removeSinkChannel(channel: string | IChannel): void;

  registerTemplate(key: string, template: IBuilderTemplate): void;
  setTemplates(templates: Record<string, IBuilderTemplate>): void;
  useTemplate(templateKey: string): void;

  saveVersion(): void;

  reset(...args: unknown[]): void;
  ctx(update?: (ctx: IBuilderCtx) => IBuilderCtx): IBuilderCtx;
}

/**
 * Represents a level in the node hierarchy.
 */
export type BuilderHierarchicalLevel = string[];

/**
 * Represents a hierarchy of node references; each key is either
 * the root of the graph or a node UUID. Each value is an array,
 * respcting ordinality, of node UUIDs.
 */
export type BuilderHierarchy = Map<string, BuilderHierarchicalLevel>;

/**
 * A level key to hierarchy entry to be used with message payload.
 */
export type BuilderHierarchyEntry = [string, BuilderHierarchicalLevel];

/**
 * Optional params for constructing generic builder objects.
 */
export type IBuilderAtomConstructorParams = {
  id?: string; // UUID v4
};

/**
 * Generic definition for any node or edge belonging to a
 * builder graph.
 */
export interface IBuilderAtom {
  /**
   * Unique identifier for the atom.
   */
  readonly id: string; // UUID v4

  /**
   * Tags are a way of distinguishing feature belonging to atoms;
   * think "flags."
   */
  tags: Set<string>;

  /*
   * Used for emiting a message via the graph channel.
   */
  emit(message: IChannelMessage): void;

  hasSinkChannel(channelId: string): boolean;
  addSinkChannel(channel: IChannel): void;
  removeSinkChannel(channel: string | IChannel): void;

  /**
   * Used for serializing the builder objects using a codec.
   */
  serialize<O>(encoder: IEncoder<IBuilderAtom, O>): O | Promise<O>;

  /**
   * Used to deserialize a representation of builder objects using a codec.
   */
  deserialize<O>(
    decoder: IDecoder<IBuilderAtom, O>,
    value: O
  ): IBuilderAtom | Promise<IBuilderAtom>;
}

/*
 * A stringed enum of all available atom types.
 */
export enum IBuilderAtomTypes {
  NODE = 'node',
  EDGE = 'edge',
}

/**
 * Object definition for any node belonging to a
 * builder.
 */
export interface IBuilderNode<
  T extends Record<string, unknown> = Record<string, unknown>,
> extends IBuilderAtom {
  /**
   * A string key represeinting the type of the node.
   */
  type: string;

  /**
   * A key representing which hierarchical level the node belongs to.
   */
  level: string;

  /**
   * The index corresponding to position of the node in its level.
   */
  index: number;

  /**
   * Generic metadata object for a node.
   */
  metadata: T;
}

/**
 * The set of properties not belonging to metadata for BuilderNodes.
 */
export type BuilderNodeBaseProperties = Pick<
  IBuilderNode,
  'level' | 'index' | 'id'
>;

/**
 * Enum for possible edge types.
 */
export enum BuilderEdgeTypes {
  CHILD = 'child',
  FORWARD = 'forward',
}

/**
 * Optional params for constructing edge objects.
 */
export interface IBuilderEdgeConstructorParams
  extends IBuilderAtomConstructorParams {
  /**
   * The type of the edge.
   */
  type: BuilderEdgeTypes;
  /**
   * Source node ID for the edge.
   */
  source: string; // UUID v4
  /**
   * Source target ID for the edge.
   */
  target: string; // UUID v4
}

/**
 * Object definition for any edge belonging to a
 * builder.
 */
export interface IBuilderEdge<
  T extends Record<string, unknown> = Record<string, unknown>,
> extends IBuilderAtom {
  /**
   * A string key represeinting the type of the edge.
   */
  type: BuilderEdgeTypes;

  /**
   * Node ID represeting the source of an edge.
   */
  source(): string; // UUID v4

  /**
   * Node ID represeting the target of an edge.
   */
  target(): string; // UUID v4

  /**
   * Generic metadata object for an edge.
   */
  metadata?: T;
}

/**
 * A function which takes the current state of an atom as input and returns
 * an atom with mutated properties.
 */
export type IBuilderStoreMutation<T extends IBuilderAtom = IBuilderAtom> = (
  atom: T
) => T;

export type IBuilderStoreValue = string | IBuilderAtom | IBuilderStoreMutation;

/**
 * In-memory store of a builder graph w/ methods related to
 * reading, mutating, etc.
 */
export interface IBuilderStore<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  /**
   * Store metadata is used to include graph-level parameters.
   */
  metadata: T;
  /**
   * Used to initialize graph data.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  init: (...args: any[]) => void;

  /**
   * Basic CRUD operations:
   */
  hasNode(atomId: string): Promise<Result<boolean>>;
  hasEdge(atomId: string): Promise<Result<boolean>>;

  getNode<T extends IBuilderNode>(atomId: string): Promise<Result<T>>;
  getEdge<T extends IBuilderEdge>(atomId: string): Promise<Result<T>>;

  getHierarchy(): Promise<Result<BuilderHierarchy>>;
  getLevel(levelId: string): Promise<Result<BuilderHierarchicalLevel>>;
  updateLevel(
    levelId: string,
    mutationFn: (level: BuilderHierarchicalLevel) => BuilderHierarchicalLevel
  ): Promise<Result>;
  removeLevel(levelId: string): Promise<Result>;

  addNode(node: IBuilderNode): Promise<Result>;
  addEdge(edge: IBuilderEdge): Promise<Result>;

  moveNode(node: IBuilderNode, level: string, index: number): Promise<Result>;

  updateNode<N extends IBuilderNode>(
    atomId: string,
    mutation: IBuilderStoreMutation<N>
  ): Promise<Result>;
  updateEdge<E extends IBuilderEdge>(
    atomId: string,
    mutation: IBuilderStoreMutation<E>
  ): Promise<Result>;

  removeNode(atomId: string): Promise<Result>;
  removeEdge(atomId: string): Promise<Result>;

  /**
   * Get all edges for a given node.
   */
  getEdgesForNode<T extends IBuilderEdge>(atomId: string): Promise<Result<T[]>>;

  /**
   * Traverses the store graph.
   *
   * @param cb - a callback function fired for every node; note: returning kills traversal and returns the result of the callback.
   */
  traverse<T = unknown>(cb: (node: IBuilderNode) => T): T | void;

  /**
   * Clears the store entirely: i.e., removes everything.
   */
  clear(): void;

  /**
   * Resets store to initial copy.
   */
  reset(): void;

  /**
   * Saves a copy of the store to session/local
   */
  save(): void;

  /**
   * Load locally stored copy of store.
   */
  load(): void;

  /**
   * Turns store into a JSON representation.
   */
  serialize(): string;

  /**
   * Returns the raw graph of a builder store.
   */
  export(): unknown;

  /**
   * Takes a JSON representation of the store and turns it
   * into a store.
   */
  deserialize(json: string): unknown;
}

/**
 * An object that provides a method encoding one thing to another.
 */
export interface IEncoder<I, O> {
  encode(value: I, ...args: unknown[]): O | Promise<O>;
}

/**
 * An object that provides a method decoding one thing to another.
 */
export interface IDecoder<I, O> {
  decode(value: O, ...args: unknown[]): I | Promise<I>;
}

/**
 * Used for serializing / deserializing.
 */
export interface ICodec<I, O> {
  encode: IEncoder<I, O>['encode'];
  decode: IDecoder<I, O>['decode'];
}

/**
 * An object that provides a method encoding one thing to another.
 */
export interface IEncoder<I, O> {
  encode(value: I, ...args: unknown[]): O | Promise<O>;
}

/**
 * An object that provides a method decoding one thing to another.
 */
export interface IDecoder<I, O> {
  decode(value: O, ...args: unknown[]): I | Promise<I>;
}

/**
 * Used for serializing / deserializing.
 */
export interface ICodec<I, O> {
  encode: IEncoder<I, O>['encode'];
  decode: IDecoder<I, O>['decode'];
}

export type BuilderStoreNodeFactoryParams<
  T extends Record<string, unknown> = Record<string, unknown>,
> = {
  id: string;
  index?: number;
  level?: string;
  tags?: string[];
  metadata: T;
};

export type BuilderStoreEdgeFactoryParams<
  T extends Record<string, unknown> = Record<string, unknown>,
> = {
  source: string;
  target: string;
  type?: BuilderEdgeTypes;
  metadata: T;
};

export type EdgeClassType<T extends IBuilderEdge> = (new (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...args: any[]
) => T) & {
  fromStore?: (params: BuilderStoreEdgeFactoryParams) => T;
};

export type NodeClassType<T extends IBuilderNode> = (new (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...args: any[]
) => T) & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fromStore?: (params: BuilderStoreNodeFactoryParams<any>) => T;
};

export interface IBuilderTemplate {
  // Called to setup the builder given a template.
  setup(builder: IBuilder): Promise<void>;
  // A method optionally called whenever setup is complete.
  completed?: (builder: IBuilder) => void;
}
