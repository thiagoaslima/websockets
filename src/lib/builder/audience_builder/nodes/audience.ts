import {LAYER_ROOT_KEY} from '../../../../constants/audience_builder.js';
import {BuilderStoreNodeFactoryParams} from '../../../../types/builder.js';
import {
  AudienceBuilderNodeTypes,
  IAudienceBuilderNode,
  NeighborOperators,
} from '../../../../types/audience_builder/index.js';
import {BuilderNode} from '../../node.js';

export enum AudienceMode {
  EXCLUDE = 'exclude',
  INCLUDE = 'include',
}

export enum AudienceUpdateContexts {
  NEGATION = 'negation',
  MODE = 'mode',
}

export interface AudienceMetadata {
  mode: AudienceMode;
  audienceId: number;
  audienceName: string;
  audienceSize: number;
  negate: boolean;
  [k: string]: unknown;
}

const SUPPORTED_MODES = [AudienceMode.EXCLUDE, AudienceMode.INCLUDE];

/**
 * A node used for including or excluding other audiences within the
 * audience builder.
 */
export class AudienceNode
  extends BuilderNode<AudienceMetadata>
  implements IAudienceBuilderNode {
  readonly type = AudienceBuilderNodeTypes.AUDIENCE;

  // Default values, to be overridden by a 'create' factory.
  level = LAYER_ROOT_KEY;
  index = 0;
  mode: AudienceMode = AudienceMode.EXCLUDE;
  negate = true;
  audienceId!: number;
  audienceName!: string;
  audienceSize!: number;

  get metadata(): AudienceMetadata {
    return {
      negate: this.negate,
      mode: this.mode,
      audienceId: this.audienceId,
      audienceName: this.audienceName,
      audienceSize: this.audienceSize,
    };
  }

  isValid(): boolean {
    return !!(
      SUPPORTED_MODES.includes(this.mode) &&
      this.audienceId &&
      !isNaN(this.audienceSize) &&
      this.audienceName
    );
  }

  onNeighborOpChange(operator: NeighborOperators) {
    const negated = operator === NeighborOperators.AND_NOT;
    this.negate = negated;
    this.mode = negated ? AudienceMode.EXCLUDE : AudienceMode.INCLUDE;

    for (const ctx of [
      AudienceUpdateContexts.NEGATION,
      AudienceUpdateContexts.MODE,
    ]) {
      this.emitUpdateEvent<AudienceNode>(ctx);
    }
  }

  static fromStore(params: BuilderStoreNodeFactoryParams): AudienceNode {
    const node = new AudienceNode({id: params.id});
    const metadata = params.metadata as AudienceMetadata;

    node.level = params.level || LAYER_ROOT_KEY;
    node.index = params.index || 0;

    node.mode = metadata.mode;
    node.negate = metadata.mode === AudienceMode.EXCLUDE;
    node.audienceId = metadata.audienceId;
    node.audienceName = metadata.audienceName;
    node.audienceSize = metadata.audienceSize;

    if (params.tags?.length) {
      node.tags = new Set(params.tags);
    }

    return node;
  }

  static create(params: {
    audienceId: number;
    audienceName: string;
    audienceSize: number;
    id?: string;
    index?: number;
    level?: string;
    mode?: AudienceMode;
  }): AudienceNode {
    const node = new AudienceNode({id: params.id});

    node.index = params.index || 0;
    node.level = params.level || LAYER_ROOT_KEY;

    if (params.mode) {
      node.mode = params.mode;
      node.negate = params.mode === AudienceMode.EXCLUDE;
    }

    node.audienceId = params.audienceId;
    node.audienceName = params.audienceName;
    node.audienceSize = params.audienceSize;

    return node;
  }
}
