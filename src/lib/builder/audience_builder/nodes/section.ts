import {LAYER_ROOT_KEY} from '../../../../constants/audience_builder.js';
import {BuilderStoreNodeFactoryParams} from '../../../../types/builder.js';
import {
  AudienceBuilderNodeTags,
  AudienceBuilderNodeTypes,
} from '../../../../types/audience_builder/index.js';
import {DatasetType} from '../../../../types/datasets.js';
import {BuilderNode} from '../../node.js';

export interface SectionMetadata {
  locked: boolean;
  defaultNodeType?: AudienceBuilderNodeTypes;
  nodeTypeConstraints: AudienceBuilderNodeTypes[];
  datasetTypeConstraint?: DatasetType;
  [k: string]: unknown;
}

export type SectionNodeMetadataMutation = (
  ctx: SectionMetadata | undefined
) => SectionMetadata;

export enum SectionNodeConstraintType {
  MEMBERSHIP = 'membership',
  FLAGS = 'flags',
  PREDICATE = 'predicate',
}

export enum SectionNodeUpdateContexts {
  LOCKED = 'locked',
  DEFAULT_TYPE = 'default-type',
}

export enum SectionNodeTags {
  PRIMARY_SECTION = 'primary-section',
  LOCKED = 'locked',
}

export type SectionNodeConstraint =
  | {
      readonly tag: SectionNodeConstraintType.MEMBERSHIP;
      readonly group: ReadonlySet<string>;
    }
  | {
      readonly tag: SectionNodeConstraintType.FLAGS;
      readonly flags: ReadonlyMap<string, boolean>;
    }
  | {
      readonly tag: SectionNodeConstraintType.PREDICATE;
      readonly predicate: (...args: unknown[]) => boolean;
    };

/**
 * Predicate which indicates whether or not the section node is locked
 * AND has a default type of 'Audience.'
 */
export function isAudienceSection(node: SectionNode): boolean {
  return (
    node.locked && node.defaultNodeType === AudienceBuilderNodeTypes.AUDIENCE
  );
}

/**
 * A node used to partition the audience builder into discrete content sections.
 */
export class SectionNode extends BuilderNode<SectionMetadata> {
  readonly type = AudienceBuilderNodeTypes.SECTION;
  private readonly constraints: Map<
    AudienceBuilderNodeTypes,
    Set<SectionNodeConstraint>
  > = new Map<AudienceBuilderNodeTypes, Set<SectionNodeConstraint>>();

  // Default values, to be overridden by a 'create' factory.
  level = LAYER_ROOT_KEY;
  index = 0;

  currentNodeType: AudienceBuilderNodeTypes = AudienceBuilderNodeTypes.FILTER;
  datasetTypeConstraint?: DatasetType;
  nodeTypeConstraints: Set<AudienceBuilderNodeTypes> = new Set();
  private _defaultNodeType?: AudienceBuilderNodeTypes;
  private _locked = false;

  get metadata(): SectionMetadata {
    return {
      locked: this.locked,
      defaultNodeType: this.defaultNodeType,
      datasetTypeConstraint: this.datasetTypeConstraint,
      nodeTypeConstraints: Array.from(this.nodeTypeConstraints),
      conditionConstraints: this.constraints,
    };
  }

  get defaultNodeType(): AudienceBuilderNodeTypes | undefined {
    return this._defaultNodeType;
  }

  set defaultNodeType(type: AudienceBuilderNodeTypes | undefined) {
    if (!type || this.acceptsNodeType(type)) {
      this._defaultNodeType = type;
      this.emitUpdateEvent(SectionNodeUpdateContexts.DEFAULT_TYPE);
    }
  }

  get locked() {
    return this._locked;
  }

  set locked(bool: boolean) {
    this._locked = bool;

    // Whenever locking a section, the default node type should be
    // frozen also.
    if (this._locked) {
      this.defaultNodeType = this.currentNodeType;
      this.addTag(SectionNodeTags.LOCKED);
    }

    if (!this._locked) this.removeTag(SectionNodeTags.LOCKED);

    this.emitUpdateEvent(SectionNodeUpdateContexts.LOCKED);
  }

  get isPrimary(): boolean {
    return this.tags.has(SectionNodeTags.PRIMARY_SECTION);
  }

  lock() {
    this.locked = true;
  }

  unlock() {
    this.locked = false;
  }

  makePrimary() {
    this.addTag(AudienceBuilderNodeTags.IMMOVABLE);
    this.addTag(AudienceBuilderNodeTags.PERMANENT);
    this.addTag(SectionNodeTags.PRIMARY_SECTION);
  }

  addConstraints(
    nodeType: AudienceBuilderNodeTypes,
    constraints: Array<SectionNodeConstraint> | Set<SectionNodeConstraint>
  ) {
    const nodeTypeConstraints =
      this.constraints.get(nodeType) || new Set<SectionNodeConstraint>();

    for (const constraint of constraints) {
      nodeTypeConstraints.add(constraint);
    }

    this.constraints.set(nodeType, nodeTypeConstraints);
  }

  removeConstraints(
    nodeType: AudienceBuilderNodeTypes,
    constraints: Array<SectionNodeConstraint> | Set<SectionNodeConstraint>
  ) {
    const nodeTypeConstraints =
      this.constraints.get(nodeType) || new Set<SectionNodeConstraint>();

    for (const constraint of constraints) {
      nodeTypeConstraints.delete(constraint);
    }

    this.constraints.set(nodeType, nodeTypeConstraints);
  }

  clearConstraints(nodeType?: AudienceBuilderNodeTypes) {
    if (nodeType) {
      this.constraints.delete(nodeType);
      return;
    }

    this.constraints.clear();

    return;
  }

  acceptsNodeType(nodeType: AudienceBuilderNodeTypes): boolean {
    if (this.nodeTypeConstraints.size === 0) return true;
    if (this.nodeTypeConstraints.has(nodeType)) return true;
    return false;
  }

  getConstraintsForNodeType(nodeType: AudienceBuilderNodeTypes) {
    if (!this.constraints.has(nodeType)) {
      return new Set<SectionNodeConstraint>();
    }

    return new Set<SectionNodeConstraint>(
      this.constraints.get(nodeType)
    ) as ReadonlySet<SectionNodeConstraint>;
  }

  static fromStore(params: BuilderStoreNodeFactoryParams): SectionNode {
    const node = new SectionNode({id: params.id});
    const metadata = params.metadata as SectionMetadata;

    node.level = params.level || LAYER_ROOT_KEY;
    node.index = params.index || 0;

    if (metadata.locked) node.locked = metadata.locked;

    if (metadata.defaultNodeType) {
      node.defaultNodeType = metadata.defaultNodeType;
    }

    if (metadata.datasetTypeConstraint) {
      node.datasetTypeConstraint = metadata.datasetTypeConstraint;
    }

    if (metadata.nodeTypeConstraints) {
      node.nodeTypeConstraints = new Set(metadata.nodeTypeConstraints);
    }

    if (params.tags?.length) {
      node.tags = new Set(params.tags);
    }

    return node;
  }

  static create(params: {
    id?: string;
    level?: string;
    index?: number;
    locked?: boolean;
    defaultNodeType?: AudienceBuilderNodeTypes;
    datasetTypeConstraint?: DatasetType;
    typeConstraints?: Array<AudienceBuilderNodeTypes>;
    constraints?: Map<AudienceBuilderNodeTypes, Array<SectionNodeConstraint>>;
  }): SectionNode {
    if (!params) throw Error('Invalid create request.');

    const node = new SectionNode({id: params.id});

    node.level = params.level ?? LAYER_ROOT_KEY;
    node.index = params.index || 0;
    if (params.locked) node.locked = params.locked;

    if (params.defaultNodeType) {
      node.defaultNodeType = params.defaultNodeType;
    }

    if (params.datasetTypeConstraint) {
      node.datasetTypeConstraint = params.datasetTypeConstraint;
    }

    if (params.typeConstraints) {
      node.nodeTypeConstraints = new Set(params.typeConstraints);
    }

    if (params.constraints) {
      params.constraints.forEach((values, key) => {
        node.addConstraints(key, values);
      });
    }

    return node;
  }
}
