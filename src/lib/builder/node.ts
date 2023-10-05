import {
  IBuilderNode,
  IBuilderAtomConstructorParams,
} from '../../types/builder.js';
import {ChannelMessage, ChannelMessageTag} from '../channel.js';
import {BuilderAtom} from './atom.js';

export enum NodeEventTags {
  MOVE = 'move',
  UPDATE = 'update',
}

export enum NodeEventContexts {
  TAGS = 'tags',
}

/**
 * Tag value for move messages.
 */
export type NodeMovePayload = {
  node: string;
  level: string;
  index: number;
};

/**
 * Tag value for update messages.
 */
export type NodeUpdatePayload<
  N extends IBuilderNode,
  C extends string = string,
> = {
  context: C;
  node: N;
};

/**
 * Node object for a builder.
 */
export abstract class BuilderNode<
    T extends Record<string, unknown> = Record<string, unknown>,
  >
  extends BuilderAtom
  implements IBuilderNode
{
  abstract type: string;
  abstract level: string;
  abstract index: number;

  constructor(params: IBuilderAtomConstructorParams) {
    super(params);
  }

  abstract get metadata(): T;

  move(level: string, index: number) {
    this.index = index;
    this.level = level;

    const tag = ChannelMessageTag.create<NodeEventTags, NodeMovePayload>(
      NodeEventTags.MOVE,
      {
        node: this.id,
        level,
        index,
      }
    );

    const message = ChannelMessage.fromTags([tag]);
    this.emit(message);
  }

  /**
   * Update events are common enough to warrant a unique emission method.
   */
  emitUpdateEvent<N extends IBuilderNode>(context: string) {
    const tag = ChannelMessageTag.create<NodeEventTags, NodeUpdatePayload<N>>(
      NodeEventTags.UPDATE,
      {context, node: this as unknown as N}
    );

    const message = ChannelMessage.fromTags([tag]);
    this.emit(message);
  }

  addTag(tag: string) {
    if (!this.tags.has(tag)) {
      this.tags.add(tag);
      this.emitUpdateEvent(NodeEventContexts.TAGS);
    }
  }

  removeTag(tag: string) {
    if (this.tags.has(tag)) {
      this.tags.delete(tag);
      this.emitUpdateEvent(NodeEventContexts.TAGS);
    }
  }
}
