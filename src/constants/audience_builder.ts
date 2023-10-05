import {ChildEdge} from '../lib/builder/audience_builder/edges/child.js';
import {NeighborEdge} from '../lib/builder/audience_builder/edges/neighbor.js';
import {AudienceNode} from '../lib/builder/audience_builder/nodes/audience.js';
import {FilterNode} from '../lib/builder/audience_builder/nodes/filter.js';
import {FlexNode} from '../lib/builder/audience_builder/nodes/flex_filter.js';
import {HeadingNode} from '../lib/builder/audience_builder/nodes/heading.js';
import {SectionNode} from '../lib/builder/audience_builder/nodes/section.js';
import {StemNode} from '../lib/builder/audience_builder/nodes/stem.js';
import {TextNode} from '../lib/builder/audience_builder/nodes/text.js';
import {
  AudienceBuilderNodeTypes,
  ExpressionOperators,
  ExpressionTypes,
  FilterOperators,
  NeighborOperators,
} from '../types/audience_builder/index.js';
import {
  NodeClassType,
  IBuilderNode,
  BuilderEdgeTypes,
  EdgeClassType,
  IBuilderEdge,
} from '../types/builder.js';

export const LAYER_ROOT_KEY = '__AB_ROOT__';

export const audienceBuilderNodeMap = new Map<
  AudienceBuilderNodeTypes,
  NodeClassType<IBuilderNode>
>([
  [AudienceBuilderNodeTypes.FILTER, FilterNode],
  [AudienceBuilderNodeTypes.FLEX, FlexNode],
  [AudienceBuilderNodeTypes.AUDIENCE, AudienceNode],
  [AudienceBuilderNodeTypes.TEXT, TextNode],
  [AudienceBuilderNodeTypes.HEADING, HeadingNode],
  [AudienceBuilderNodeTypes.SECTION, SectionNode],
  [AudienceBuilderNodeTypes.STEM, StemNode],
]);

export const abNodeLabelMap = new Map([
  [AudienceBuilderNodeTypes.FILTER, 'filter'],
  [AudienceBuilderNodeTypes.FLEX, 'dataset'],
  [AudienceBuilderNodeTypes.AUDIENCE, 'audience exclusion'],
]);

export const audienceBuilderEdgeMap = new Map<
  BuilderEdgeTypes,
  EdgeClassType<IBuilderEdge>
>([
  [BuilderEdgeTypes.FORWARD, NeighborEdge],
  [BuilderEdgeTypes.CHILD, ChildEdge],
]);

export const daysOperators = [
  ExpressionOperators.IN_LAST_DAYS,
  ExpressionOperators.OVER_DAYS_AGO,
  ExpressionOperators.BETWEEN_DAYS_AGO,
  ExpressionOperators.ON_DAYS_AGO,
  ExpressionOperators.IN_NEXT_DAYS,
  ExpressionOperators.OVER_DAYS_FROM_NOW,
  ExpressionOperators.BETWEEN_DAYS_FROM_NOW,
  ExpressionOperators.ON_DAYS_FROM_NOW,
];

export const betweenOperators = [
  ExpressionOperators.BETWEEN,
  ExpressionOperators.BETWEEN_DAYS_AGO,
  ExpressionOperators.BETWEEN_DAYS_FROM_NOW,
];

export const nullOperators = [
  ExpressionOperators.IS_NULL,
  ExpressionOperators.IS_NOT_NULL,
  ExpressionOperators.IS_EMPTY,
  ExpressionOperators.IS_NOT_EMPTY,
];

export const numericArrayOperators = [
  ExpressionOperators.LENGTH_LESS,
  ExpressionOperators.LENGTH_GREATER,
  ExpressionOperators.LENGTH_EQUALS,
];

export const validStringOperators = [
  ExpressionOperators.EQUALS,
  ExpressionOperators.DOES_NOT_EQUAL,
  ExpressionOperators.IS_NULL,
  ExpressionOperators.IS_NOT_NULL,
  ExpressionOperators.CONTAINS,
  ExpressionOperators.STARTS_WTIH,
  ExpressionOperators.ENDS_WITH,
];

export const validNumberOperators = [
  ExpressionOperators.EQUALS,
  ExpressionOperators.GREATER_THAN,
  ExpressionOperators.LESS_THAN,
  ExpressionOperators.GREATER_THAN_OR_EQUAL,
  ExpressionOperators.LESS_THAN_OR_EQUAL,
  ExpressionOperators.BETWEEN,
  ExpressionOperators.IS_NULL,
  ExpressionOperators.IS_NOT_NULL,
];

export const validDatetimeOperators = [
  ExpressionOperators.EQUALS, // Might have to remove depending on Quervice support
  ExpressionOperators.DOES_NOT_EQUAL, // Might have to remove depending on Quervice support
  ExpressionOperators.IS_NULL,
  ExpressionOperators.IS_NOT_NULL,
  ExpressionOperators.GREATER_THAN, // i.e., "After date"
  ExpressionOperators.LESS_THAN, // i.e., "Before date"
  ExpressionOperators.BETWEEN,
  ExpressionOperators.IN_LAST_DAYS,
  ExpressionOperators.OVER_DAYS_AGO,
  ExpressionOperators.BETWEEN_DAYS_AGO,
  ExpressionOperators.ON_DAYS_AGO,
  ExpressionOperators.IN_NEXT_DAYS,
  ExpressionOperators.OVER_DAYS_FROM_NOW,
  ExpressionOperators.BETWEEN_DAYS_FROM_NOW,
  ExpressionOperators.ON_DAYS_FROM_NOW,
];

export const validArrayOperators = [
  ExpressionOperators.EQUALS,
  ExpressionOperators.DOES_NOT_EQUAL,
  ExpressionOperators.IS_EMPTY,
  ExpressionOperators.IS_NOT_EMPTY,
  ExpressionOperators.LENGTH_EQUALS,
  ExpressionOperators.LENGTH_GREATER,
  ExpressionOperators.LENGTH_LESS,
];

export const datetimeExpressionTypes = [
  ExpressionTypes.DATETIME,
  ExpressionTypes.TIMESTAMP,
  ExpressionTypes.DATE,
];

export const floatExpressionTypes = [
  ExpressionTypes.FLOAT,
  ExpressionTypes.FLOAT_64,
  ExpressionTypes.NUMERIC,
];

export const integerExpressionTypes = [
  ExpressionTypes.NUMBER,
  ExpressionTypes.INT,
  ExpressionTypes.INT_64,
  ExpressionTypes.INTEGER,
  ExpressionTypes.INTEGER_64,
];

export const numericExpressionTypes: ExpressionTypes[] = [
  ...integerExpressionTypes,
  ...floatExpressionTypes,
];

export const booleanExpressionTypes = [
  ExpressionTypes.BOOL,
  ExpressionTypes.BOOLEAN,
];

export const neighborOperatorLabelMap = new Map([
  [NeighborOperators.AND, 'And'],
  [NeighborOperators.AND_NOT, 'And not'],
  [NeighborOperators.OR, 'Or'],
  [NeighborOperators.XOR, 'Exclusive or'],
]);

export const leadingNeighborOperatorLabels = new Map([
  [NeighborOperators.AND, 'Where'],
  [NeighborOperators.AND_NOT, 'Where not'],
]);

export const filterOperatorLabelMap = new Map([
  [FilterOperators.AND, 'And'],
  [FilterOperators.OR, 'Or'],
]);

export const stemmableNeighborOperators = [
  NeighborOperators.OR,
  NeighborOperators.XOR,
];

export const conjuntiveNeighborOperators = [
  NeighborOperators.AND,
  NeighborOperators.AND_NOT,
];

export const conjuctiveOperatorMap = new Map([
  [AudienceBuilderNodeTypes.AUDIENCE, conjuntiveNeighborOperators],
  [AudienceBuilderNodeTypes.FILTER, conjuntiveNeighborOperators],
  [AudienceBuilderNodeTypes.STEM, conjuntiveNeighborOperators],
  [
    AudienceBuilderNodeTypes.FLEX,
    [NeighborOperators.AND, NeighborOperators.OR],
  ],
]);
