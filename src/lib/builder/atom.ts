import {
  IBuilderAtom,
  IBuilderAtomConstructorParams,
  IDecoder,
  IEncoder,
} from '../../types/builder.js';
import {IChannel, IChannelMessage} from '../channel.js';
import {v4} from 'uuid';
import {isString} from '../../utils/predicates.js';

/**
 * An atom is an independent object representing the state of a part of a builder.
 * An atom, for instance, can be a node, an edge, a setting, a preference, or any
 * other construct needed for a builder.
 */
export class BuilderAtom implements IBuilderAtom {
  protected _id: string;
  private sinks: Map<string, IChannel> = new Map();

  tags: Set<string> = new Set();

  constructor(params: IBuilderAtomConstructorParams) {
    this._id = params?.id || v4();
  }

  get id(): string {
    return this._id;
  }

  emit(message: IChannelMessage): void {
    this.sinks.forEach(channel => {
      channel.publish(message);
    });
  }

  hasSinkChannel(id: string) {
    return this.sinks.has(id);
  }

  addSinkChannel(channel: IChannel) {
    this.sinks.set(channel.id, channel);
  }

  removeSinkChannel(channel: string | IChannel) {
    if (isString(channel)) {
      this.sinks.delete(channel);
      return;
    }

    this.sinks.delete(channel.id);
  }

  serialize<O>(encoder: IEncoder<BuilderAtom, O>): O | Promise<O> {
    return encoder.encode(this);
  }

  deserialize<O>(
    decoder: IDecoder<BuilderAtom, O>,
    value: O
  ): BuilderAtom | Promise<BuilderAtom> {
    return decoder.decode(value);
  }
}
