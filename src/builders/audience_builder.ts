import {
  audienceBuilderEdgeMap,
  audienceBuilderNodeMap,
} from '../constants/audience_builder.js';
import {
  GraphologyConfig,
  GraphologyStore,
} from '../lib/builder/stores/graphology.js';
import {Channel} from '../lib/channel.js';
import {Builder} from '../lib/builder/index.js';
import {Dataset} from '../types/datasets.js';
import {SectionNode} from '../lib/builder/audience_builder/nodes/section.js';
import {pushNode} from '../utils/nodes.js';

export const AUDIENCE_BUILDER_KEY = 'ab';

const channel = Channel.create('ab:internal');
const config: GraphologyConfig = {
  nodeClassMap: audienceBuilderNodeMap,
  edgeClassMap: audienceBuilderEdgeMap,
};

const store = GraphologyStore.create({config});

export class AudienceBuilder extends Builder {
  datasets: Dataset[] = [];
  private _primarySectionId!: string;

  get primarySection(): SectionNode {
    return this.getNodeFromCache(this._primarySectionId) as SectionNode;
  }

  async createPrimarySection(): Promise<SectionNode> {
    if (this.primarySection) return this.primarySection;

    const section = SectionNode.create({});
    section.makePrimary();
    await pushNode(this, section);
    this._primarySectionId = section.id;

    return this.primarySection;
  }
}

/** Module instance of the AUdience Builder. */
export const createAudienceBuilder = () =>
  new AudienceBuilder({
    key: AUDIENCE_BUILDER_KEY,
    store,
    channel,
  });
