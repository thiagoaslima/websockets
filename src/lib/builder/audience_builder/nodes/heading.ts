import {LAYER_ROOT_KEY} from '../../../../constants/audience_builder.js';
import {BuilderStoreNodeFactoryParams} from '../../../../types/builder.js';
import {AudienceBuilderNodeTypes} from '../../../../types/audience_builder/index.js';
import {range} from '../../../../utils/arrays.js';
import {TextMetadata, TextNode} from './text.js';

export interface HeadingMetadata extends TextMetadata {
  headingLevel: HeadingLevel;
}

export enum HeadingLevel {
  ONE = 1,
  TWO = 2,
  THREE = 3,
}

export enum HeadingUpdateContexts {
  HEADING_LEVEL = 'heading-level',
}

export const headingLevelRange = [
  ...range(HeadingLevel.ONE, HeadingLevel.THREE),
];

/**
 * A content node that represents heading content to display within
 * the audience builder.
 */
export class HeadingNode extends TextNode<HeadingMetadata> {
  type = AudienceBuilderNodeTypes.HEADING;

  // Default values, to be overridden by a 'create' factory.
  level = LAYER_ROOT_KEY;
  index = 0;

  // Heading specific props.
  headingLevel: HeadingLevel = HeadingLevel.ONE;

  get metadata(): HeadingMetadata {
    return {
      headingLevel: this.headingLevel,
      content: this.content,
      indentation: this.indentation,
    };
  }

  setHeadingLevel(headingLevel: HeadingLevel) {
    if (
      headingLevel >= HeadingLevel.ONE &&
      headingLevel <= HeadingLevel.THREE
    ) {
      this.headingLevel = headingLevel;
      this.emitUpdateEvent(HeadingUpdateContexts.HEADING_LEVEL);
    }
  }

  static fromStore(params: BuilderStoreNodeFactoryParams): HeadingNode {
    const metadata = params.metadata as HeadingMetadata;
    const heading = HeadingNode.create({
      id: params.id,
      level: params.level,
      index: params.index,
      headingLevel: metadata.headingLevel,
    });

    if (metadata.content) heading.content = metadata.content;
    if (metadata.indentation) heading.indentation = metadata.indentation;

    if (params.tags?.length) {
      heading.tags = new Set(params.tags);
    }

    return heading;
  }

  static create(params: {
    id?: string;
    level?: string;
    index?: number;
    headingLevel?: HeadingLevel;
    content?: string;
    autoFocus?: boolean;
  }): HeadingNode {
    const heading = new HeadingNode({id: params.id});

    heading.level = params.level || LAYER_ROOT_KEY;
    heading.index = params.index || 0;

    if (params.headingLevel) {
      heading.headingLevel = params.headingLevel;
    }

    if (params.content) {
      heading.content = params.content;
    }

    if (typeof params.autoFocus === 'boolean') {
      heading.autoFocusElement = params.autoFocus;
    }

    return heading;
  }
}
