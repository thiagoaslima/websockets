import {IBuilderEdge, IBuilderNode, IBuilderCache} from '../../types/builder.js';

export class BuilderCache implements IBuilderCache {
  nodes: Map<string, IBuilderNode> = new Map();
  edges: Map<string, IBuilderEdge> = new Map();
  
  /** Clears the cache of nodes & edges. */
  clear() {
    this.nodes = new Map();
    this.edges = new Map();
  }
}
