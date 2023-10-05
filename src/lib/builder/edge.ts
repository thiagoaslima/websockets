import {
  BuilderEdgeTypes,
  IBuilderEdge,
  IBuilderEdgeConstructorParams,
} from '../../types/builder.js';
import {ChannelMessage, ChannelMessageTag} from '../channel.js';
import {BuilderAtom} from './atom.js';

export enum EdgeEventTags {
  UPDATE = 'update',
}

/**
 * Tag value for update messages.
 */
export type EdgeUpdatePayload<
  E extends IBuilderEdge,
  C extends string = string,
> = {
  context?: C;
  edge: E;
};

/**
 * Edge object for a builder.
 */
export abstract class BuilderEdge<
    T extends Record<string, unknown> = Record<string, unknown>,
  >
  extends BuilderAtom
  implements IBuilderEdge
{
  abstract type: BuilderEdgeTypes;

  private _source: string;
  private _target: string;

  /**
   * Used for serializing attributes within the node store. Place any specific attributes in here
   * that you wish to be serialized.
   */
  abstract get metadata(): T;

  constructor(params: IBuilderEdgeConstructorParams) {
    const id =
      params.id ||
      BuilderEdge.createEdgeId(
        params.source,
        params.target,
        BuilderEdgeTypes.FORWARD
      );

    super({
      id,
      ...params,
    });

    this._id = id;
    this._source = params.source;
    this._target = params.target;
  }

  source() {
    return this._source;
  }

  target() {
    return this._target;
  }

  /**
   * Update events are common enough to warrant a unique emission method.
   */
  emitUpdateEvent<E extends IBuilderEdge>(context?: string) {
    const tag = ChannelMessageTag.create<EdgeEventTags, EdgeUpdatePayload<E>>(
      EdgeEventTags.UPDATE,
      {context, edge: this as unknown as E}
    );

    const message = ChannelMessage.fromTags([tag]);
    this.emit(message);
  }

  static createEdgeId(
    source: string,
    target: string,
    type: BuilderEdgeTypes
  ): string {
    return `${source}:${type}:${target}`;
  }
}
