import {isNonEmptyString} from '../utils/predicates';
import {v4} from 'uuid';
import {
  filter,
  Subject as RxJSSubject,
  Observable as RxJSObservable,
} from 'rxjs';

export interface IChannelMessageTag<V = unknown> {
  /** references a type/kind of tag */
  key(): string;

  /** the piece of data/information carried by a tag instance */
  value(): V;
}

export interface IChannelMessage {
  /** mostly useful for filtering, routing, and providing a declarative description on how to handle the message */
  tags(): Set<IChannelMessageTag>;

  /**
   * For any two messages, there should be a deterministic way
   * to qualify them as strictly equal (or not)
   * */
  equals(message: IChannelMessage): boolean;

  /**
   * messages should have a notion of ordering.
   * Concrete implementations of this interface
   * should, in most cases, just use of a timestamp value
   *
   * -1 => means the instance w/ this method is "less than" the message passed as parameter
   * 0 => means the instance w/ this method is "equal" the message passed as parameter
   * 1 => means the instance w/ this method is "greater than" the message passed as parameter
   * */
  compare(message: IChannelMessage): -1 | 0 | 1;

  /** Determines whether or not a message has a tag */
  hasTag(key: string): boolean;
}

export interface IChannel {
  /** an identifier for the channel */
  readonly id: string;

  /** For sending a message into a channel */
  publish(message: IChannelMessage): void;

  /**
   * Allows a client to subscribe to messages that are published to a channel.
   * It returns a function that can later be invoked to cancel all the subscriptions that are passed as parameters
   */
  subscribe(
    subscriptions: IChannelSubscription[]
  ): (cb?: CallableFunction) => void;

  /**
   * Allows a client to cancel a set of subscription
   */
  unsubscribe(subscriptions: IChannelSubscription[]): void;
}

export interface IChannelSubscription {
  /**
   * A predicate function that determines whether a message should be pushed to
   * the subscription handler or not.
   * Prevents unnecessary processing of messages for a given subscription
   * */
  filter(message: IChannelMessage): boolean;

  /**
   * processes a channel's messages
   */
  handler(message: IChannelMessage): void;
}

/**
 * Default implementation of a channel message tag.
 */
export class ChannelMessageTag<K extends string = string, V = unknown>
  implements IChannelMessageTag<V>
{
  private constructor(
    private _key: K,
    private _value: V
  ) {
    this._key = _key;
    this._value = _value;
  }

  static create<K extends string = string, T = unknown>(
    key: K,
    value: T
  ): ChannelMessageTag<K, T> {
    const tag = new ChannelMessageTag<K, T>(key, value);
    return tag;
  }

  static fromKey<K extends string = string>(
    key: K
  ): ChannelMessageTag<K, undefined> {
    const tag = new ChannelMessageTag<K, undefined>(key, undefined);
    return tag;
  }

  key() {
    return this._key;
  }

  value() {
    return this._value;
  }
}

/**
 * Default implementation of a channel message.
 */
export class ChannelMessage implements IChannelMessage {
  private id = v4();
  private timestamp = new Date();
  private _tags: Set<IChannelMessageTag> = new Set();

  static fromTags(
    payload: IChannelMessageTag | IChannelMessageTag[]
  ): ChannelMessage {
    const message = new ChannelMessage();
    message.addTags(payload);

    return message;
  }

  tags() {
    return new Set(this._tags);
  }

  addTags(tags: IChannelMessageTag | IChannelMessageTag[]) {
    if (!Array.isArray(tags)) {
      this._tags.add(tags);
      return;
    }

    tags.forEach(tag => this._tags.add(tag));
  }

  hasTag(key: string) {
    return Array.from(this._tags).some(t => t.key() === key);
  }

  equals(message: ChannelMessage) {
    return this.id === message.id;
  }

  compare(message: ChannelMessage) {
    if (this.timestamp < message.timestamp) return -1;
    if (this.timestamp > message.timestamp) return 1;

    return 0;
  }
}

export class Channel implements IChannel {
  private active = true;
  constructor(
    private readonly _id: string,
    /**
     * TODO: buffer should be a circular buffer or priority queue if we want the buffer to have a max capacity.
     * */
    private buffer: Set<IChannelMessage> = new Set<IChannelMessage>(),
    private subscriptions: Set<IChannelSubscription> = new Set<IChannelSubscription>()
  ) {
    this.pushBuffer();
  }

  private pushBuffer(): void {
    // Push messages (from buffer) to subscribers
    for (const message of this.buffer) {
      try {
        this.emit(message);
      } catch (error) {
        /**
         * In theory this error block should never have to run.
         * Subscription handlers should not be throwing errors expecting the Channel instance to handle them
         * */
        console.error(
          this._id,
          ':error: serve(message) failed',
          new Date().getTime(),
          error
        );
      } finally {
        this.buffer.delete(message);
      }
    }
  }

  private emit(message: IChannelMessage) {
    for (const subscription of this.subscriptions) {
      if (subscription.filter(message)) subscription.handler(message);
    }
  }

  get id(): string {
    return this._id;
  }

  publish(message: IChannelMessage) {
    this.buffer.add(message);
    this.pushBuffer();
  }

  flush() {
    this.buffer.clear();
  }

  destroy() {
    this.active = false;
  }

  subscribe(
    subscriptions: IChannelSubscription[]
  ): (cb?: CallableFunction) => void {
    for (const subscription of subscriptions) {
      this.subscriptions.add(subscription);
    }

    return (cb?: CallableFunction) => {
      for (const subscription of subscriptions) {
        this.subscriptions.delete(subscription);
      }
      cb && cb();
    };
  }

  unsubscribe(subscriptions: IChannelSubscription[]): void {
    for (const subscription of subscriptions) {
      this.subscriptions.delete(subscription);
    }
  }

  static is(obj: unknown): obj is Channel {
    return obj instanceof Channel;
  }

  static create(id?: string) {
    const _id = isNonEmptyString(id)
      ? id.trim()
      : `channel:${new Date().getTime()}-${Math.random()}`;

    return new Channel(_id);
  }
}

export class RxJSChannel implements IChannel {
  private active = true;
  private constructor(
    private readonly _id: string,
    private readonly stream: RxJSSubject<IChannelMessage> = new RxJSSubject<IChannelMessage>(),
    private subscriptions: Map<
      IChannelSubscription,
      [
        RxJSObservable<IChannelMessage>,
        /** cleanup object */ {unsubscribe: CallableFunction},
      ]
    > = new Map<
      IChannelSubscription,
      [RxJSObservable<IChannelMessage>, {unsubscribe: CallableFunction}]
    >()
  ) {}

  get id(): string {
    return this._id;
  }

  publish(message: IChannelMessage) {
    if (!this.active) throw Error('Channel is not active');
    this.stream.next(message);
  }

  /** removes all subscriptions */
  flush() {
    this.unsubscribe(this.subscriptions.keys());
  }

  destroy() {
    if (!this.active) return;
    this.active = false;
    this.flush();
    this.stream.unsubscribe();
    this.stream.complete();
  }

  subscribe(
    subscriptions: Iterable<IChannelSubscription>
  ): (cb?: CallableFunction) => void {
    if (!this.active) throw Error('Channel is not active');

    for (const subscription of subscriptions) {
      const sink = this.stream.pipe(filter(subscription.filter));
      this.subscriptions.set(subscription, [
        sink,
        sink.subscribe(subscription.handler),
      ]);
    }

    return (cb?: CallableFunction) => {
      this.unsubscribe(subscriptions);
      cb && cb();
    };
  }

  unsubscribe(subscriptions: Iterable<IChannelSubscription>): void {
    for (const subscription of subscriptions) {
      const [, cleanup] = this.subscriptions.get(subscription) || [];
      cleanup && cleanup.unsubscribe();
    }
  }

  static is(obj: unknown): obj is RxJSChannel {
    return obj instanceof RxJSChannel;
  }

  static create(id?: string, stream?: RxJSSubject<IChannelMessage>) {
    const _id = isNonEmptyString(id)
      ? id.trim()
      : `rxjs-channel:${new Date().getTime()}-${Math.random()}`;

    return new RxJSChannel(_id, stream);
  }
}
