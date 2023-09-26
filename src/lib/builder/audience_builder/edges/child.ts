import {
  IBuilder,
  BuilderEdgeTypes,
  IBuilderEdgeConstructorParams,
  IBuilderNode,
} from '../../../../types/builder.js';
import {BuilderEdge} from '../../edge.js';

type ChildEdgeConstructorParams = Omit<IBuilderEdgeConstructorParams, 'type'> & {
  builder?: IBuilder;
};

export interface ChildEdgeMetadata {
  [k: string]: unknown;
}

export type ChildEdgeMetadataMutation = (
  ctx: ChildEdgeMetadata | undefined
) => ChildEdgeMetadata;

export class ChildEdge extends BuilderEdge<ChildEdgeMetadata> {
  readonly type = BuilderEdgeTypes.CHILD;
  private builder?: IBuilder;

  constructor({
    builder,
    id,
    source,
    target,
  }: ChildEdgeConstructorParams) {
    super({id, source, target, type: BuilderEdgeTypes.CHILD});
    if (builder) this.builder = builder; 
  }

  get metadata(): ChildEdgeMetadata {
    return {};
  }

  getSourceNode(): Promise<IBuilderNode | void> {
    if (!this.builder) return Promise.reject();
    return this.builder.getNode(this.source());
  }

  getTargetNode(): Promise<IBuilderNode | void> {
    if (!this.builder) return Promise.reject();
    return this.builder.getNode(this.target());
  }

  static createEdgeId(source: string, target: string): string {
    return `${source}:${BuilderEdgeTypes.CHILD}:${target}`;
  }

  static create(source: string, target: string, builder?: IBuilder): ChildEdge {
    const id = ChildEdge.createEdgeId(source, target);

    const edge = new ChildEdge({builder, id, source, target});
    return edge;
  }
}
