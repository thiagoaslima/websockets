import {LAYER_ROOT_KEY} from '../../../../constants/audience_builder.js';
import {BuilderStoreNodeFactoryParams} from '../../../../types/builder.js';
import {
  AudienceBuilderNodeTypes,
  IAudienceBuilderNode,
} from '../../../../types/audience_builder/index.js';
import {BuilderNode} from '../../node.js';

export interface TextMetadata {
  content: string;
  indentation: TextIndentation;
  [k: string]: unknown;
}

export enum TextUpdateContexts {
  CONTENT = 'content',
  INDENTATION = 'indentation',
}

export enum TextIndentation {
  ZERO,
  ONE,
  TWO,
  THREE,
  FOUR,
  FIVE,
  SIX,
}

/**
 * A generic text node for rendering content to display within
 * the audience builder.
 */
export class TextNode<M extends TextMetadata = TextMetadata>
  extends BuilderNode<M>
  implements IAudienceBuilderNode
{
  type = AudienceBuilderNodeTypes.TEXT;
  content = '';
  indentation: TextIndentation = TextIndentation.ZERO;

  // Default values, to be overridden by a 'create' factory.
  level = LAYER_ROOT_KEY;
  index = 0;
  autoFocusElement = true;

  get metadata(): M {
    return {
      content: this.content,
      indentation: this.indentation,
    } as M;
  }

  isValid(): boolean {
    return !!this.content;
  }

  setIndentation(indentation: number) {
    if (indentation !== -1 && indentation <= TextIndentation.SIX) {
      this.indentation = indentation;
      this.emitUpdateEvent(TextUpdateContexts.INDENTATION);
    }
  }

  setContent(content: string) {
    this.content = content;
    this.emitUpdateEvent(TextUpdateContexts.CONTENT);
  }

  static fromStore(params: BuilderStoreNodeFactoryParams): TextNode {
    const text = TextNode.create({
      id: params.id,
      level: params.level,
      index: params.index,
    });

    const metadata = params.metadata as TextMetadata;
    if (metadata.content) text.content = metadata.content;
    if (metadata.indentation) text.indentation = metadata.indentation;

    if (params.tags?.length) {
      text.tags = new Set(params.tags);
    }

    return text;
  }

  static create(params: {
    id?: string;
    level?: string;
    index?: number;
    content?: string;
    autoFocus?: boolean;
  }): TextNode {
    const text = new TextNode({id: params.id});

    text.level = params.level || LAYER_ROOT_KEY;
    text.index = params.index || 0;

    if (params.content) {
      text.content = params.content;
    }

    if (typeof params.autoFocus === 'boolean') {
      text.autoFocusElement = params.autoFocus;
    }

    return text;
  }
}
