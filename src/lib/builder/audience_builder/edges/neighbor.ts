import {
  conjuctiveOperatorMap,
  stemmableNeighborOperators,
} from '../../../../constants/audience_builder.js';
import {ChannelMessage, ChannelMessageTag} from '../../../channel.js';
import {
  BuilderEdgeTypes,
  BuilderStoreEdgeFactoryParams,
  IBuilderEdgeConstructorParams,
  IBuilderNode,
  IBuilder,
} from '../../../../types/builder.js';
import {
  AudienceBuilderNodeTypes,
  NeighborOperators,
} from '../../../../types/audience_builder/index.js';
import {isFilter, isFlex, isStem} from '../../../../utils/audience_builder.js';
import {BuilderEdge, EdgeUpdatePayload} from '../../edge.js';

export const filterOperators = [
  NeighborOperators.AND,
  NeighborOperators.OR,
  NeighborOperators.AND_NOT,
];

type NeighborEdgeConstructorParams = Omit<IBuilderEdgeConstructorParams, 'type'> & {
  builder?: IBuilder;
};

export const stemOperators = [NeighborOperators.OR];

export enum NeighborEdgeEvents {
  OPERATOR_CHANGE = 'operator-change',
}

export interface NeighborMetadata {
  [k: string]: unknown;
  operator?: NeighborOperators;
}

export type NeighborEdgeMetadataMutation = (
  ctx: NeighborMetadata | undefined
) => NeighborMetadata;

export class NeighborEdge extends BuilderEdge<NeighborMetadata> {
  readonly type = BuilderEdgeTypes.FORWARD;
  _operator?: NeighborOperators; // For use with filters

  private builder?: IBuilder;

  constructor({
    builder,
    id,
    source,
    target,
  }: NeighborEdgeConstructorParams) {
    super({id, source, target, type: BuilderEdgeTypes.FORWARD});
    if (builder) this.builder = builder;
  }

  get metadata(): NeighborMetadata {
    return {
      operator: this.operator,
    };
  }

  get operator() {
    return this._operator;
  }

  set operator(op: NeighborOperators | undefined) {
    this._operator = op;

    const tag = ChannelMessageTag.create<
      NeighborEdgeEvents,
      EdgeUpdatePayload<NeighborEdge>
    >(NeighborEdgeEvents.OPERATOR_CHANGE, {edge: this});

    const message = ChannelMessage.fromTags([tag]);
    this.emit(message);
  }

  getSourceNode(): IBuilderNode | void {
    if (!this.builder) return;
    return this.builder.getNodeFromCache(this.source());
  }

  getTargetNode(): IBuilderNode | void {
    if (!this.builder) return;
    return this.builder.getNodeFromCache(this.target());
  }

  validOperators(opts: {allowFlexOrs: boolean} = {allowFlexOrs: false}): NeighborOperators[] {
    let operators = Object.values(NeighborOperators);
    const target = this.getTargetNode();
    const source = this.getSourceNode();

    if (!target || !source || !this.builder) return [];

    const parent = this.builder.getNodeFromCache(target.level);
    if (parent?.type === AudienceBuilderNodeTypes.STEM) {
      operators = operators.filter(op => {
        return stemOperators.includes(op);
      });
    }

    if (
      isStem(target) ||
      isStem(source) ||
      source.type === AudienceBuilderNodeTypes.AUDIENCE
    ) {
      operators = operators.filter(op => {
        return !stemmableNeighborOperators.includes(op);
      });
    }

    if (target.type === AudienceBuilderNodeTypes.FLEX) {
      operators = [
        ...operators.filter(op => {
          return op !== NeighborOperators.AND_NOT;
        }),
      ];

      if (opts.allowFlexOrs) operators.push(NeighborOperators.OR);
    }

    if (target.type === AudienceBuilderNodeTypes.AUDIENCE) {
      operators = operators.filter(op => {
        return !stemmableNeighborOperators.includes(op);
      });
    }

    if (isFilter(target)) {
      operators = operators.filter(op => {
        return filterOperators.includes(op);
      });
    }

    return operators;
  }

  updateOperator(
    operator: NeighborOperators,
    opts: {allowFlexOrs: boolean} = {allowFlexOrs: true}
  ) {
    if (!this.validOperators({allowFlexOrs: opts.allowFlexOrs}).includes(operator)) {
      return;
    }

    this.operator = operator;
    this.emitUpdateEvent<NeighborEdge>();
  }

  static shouldDisplayOperator(
    source: IBuilderNode,
    target: IBuilderNode
  ): boolean {
    if (isFilter(source)) return isFilter(target);
    if (isFlex(source)) return isFlex(target);
    return false;
  }

  static createEdgeId(source: string, target: string): string {
    return `${source}:${BuilderEdgeTypes.FORWARD}:${target}`;
  }

  static fromStore(params: BuilderStoreEdgeFactoryParams): NeighborEdge {
    const id = NeighborEdge.createEdgeId(params.source, params.target);
    const metadata = params.metadata as NeighborMetadata;
    const edge = new NeighborEdge({
      id,
      source: params.source,
      target: params.target,
    });

    if (metadata.operator) {
      edge.updateOperator(metadata.operator);
    }

    return edge;
  }

  static create(source: string, target: string, builder?: IBuilder): NeighborEdge {
    const id = NeighborEdge.createEdgeId(source, target);

    const edge = new NeighborEdge({builder, id, source, target});
    return edge;
  }
}
