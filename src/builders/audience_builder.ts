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

export const AUDIENCE_BUILDER_KEY = 'ab';

const channel = Channel.create('ab:internal');
const config: GraphologyConfig = {
  nodeClassMap: audienceBuilderNodeMap,
  edgeClassMap: audienceBuilderEdgeMap,
};

const store = GraphologyStore.create({config});

/** Module instance of the AUdience Builder. */
export const AudienceBuilder = new Builder({
  key: AUDIENCE_BUILDER_KEY,
  store,
  channel,
});
