import {LAYER_ROOT_KEY} from '../../../../constants/audience_builder.js';
import {BuilderStoreNodeFactoryParams, IBuilder} from '../../../../types/builder.js';
import {
  AudienceBuilderNodeTypes,
  ExpressionValueTuple,
  IAudienceBuilderNode,
  NeighborOperators,
} from '../../../../types/audience_builder/index.js';
import {DatasetType, FlexDatasets} from '../../../../types/datasets.js';
import {StemMetadata, StemNode} from './stem.js';

export interface FlexMetadata {
  negate: boolean;
  aggregate: AggregateRepresentation;
  datasetType: FlexDatasets;
  datasetGroupId: number;
  datasetId?: number;
  [k: string]: unknown;
}

export type FlexStemMetadata = FlexMetadata & StemMetadata;

export enum FlexUpdateContexts {
  UPDATE_AGGREGATE = 'update-aggregate',
}

export type AggregateRepresentation = {
  function: AggregateFunction;
  operator: AggregateOperators;
  value: AggregateValueTuple;
  column?: string;
};

export enum AggregateFunction {
  COUNT = 'COUNT',
  SUM = 'SUM',
  AVG = 'AVG',
}

export enum AggregateOperators {
  LESS_THAN = '<',
  LESS_THAN_OR_EQUAL = '<=',
  GREATER_THAN = '>',
  GREATER_THAN_OR_EQUAL = '>=',
  EQUAL_TO = '==',
  BETWEEN = 'between',
}

export const aggregateOperatorMap = new Map([
  [AggregateOperators.GREATER_THAN, 'more than'],
  [AggregateOperators.LESS_THAN, 'less than'],
  [AggregateOperators.GREATER_THAN_OR_EQUAL, 'more than or equal to'],
  [AggregateOperators.LESS_THAN_OR_EQUAL, 'less than or equal to'],
  [AggregateOperators.BETWEEN, 'between'],
  [AggregateOperators.EQUAL_TO, 'exactly'],
]);

export type AggregateDisplayDomain = string;
export type AggregateDisplayUnit = string;
export type AggregateDisplayTuple = [
  AggregateDisplayDomain,
  AggregateDisplayUnit
];
export enum AggregateDisplayIndices {
  ONE,
  TWO,
}
export type AggregateDisplayMap = Map<AggregateFunction, AggregateDisplayTuple>;

export const functionsWithColumnRequired = [
  AggregateFunction.AVG,
  AggregateFunction.SUM,
];

export const transactionsAggregateDisplayMap: AggregateDisplayMap = new Map([
  [AggregateFunction.COUNT, ['Customers have', 'purchases']],
  [AggregateFunction.AVG, ['The average of values in', '']],
  [AggregateFunction.SUM, ['The sum of values in', '']],
]);

export const eventsAggregateDisplayMap: AggregateDisplayMap = new Map([
  [AggregateFunction.COUNT, ['Customers match', 'events']],
  [AggregateFunction.AVG, ['The average of all values in', '']],
  [AggregateFunction.SUM, ['The sum of all values in', '']],
]);

export const DEFAULT_AGGREGATE_VALUE: AggregateValueTuple = [0, null];

export type AggregateValueTuple = ExpressionValueTuple<number>;

export class AggregateExpression {
  private allowedFunctions: AggregateFunction[] = [];
  private _function: AggregateFunction = AggregateFunction.COUNT;
  private builder?: IBuilder;
  datasetType: FlexDatasets = DatasetType.TRANSACTION;
  operator: AggregateOperators = AggregateOperators.GREATER_THAN;
  value: AggregateValueTuple = DEFAULT_AGGREGATE_VALUE;
  column?: string;

  get function() {
    return this._function;
  }

  static getDisplayMap(datasetType: FlexDatasets): AggregateDisplayMap {
    switch (datasetType) {
      case DatasetType.EVENT: {
        return eventsAggregateDisplayMap;
      }

      case DatasetType.TRANSACTION:
      default: {
        return transactionsAggregateDisplayMap;
      }
    }
  }

  get display(): AggregateDisplayTuple | undefined {
    return AggregateExpression.generateDisplay(this.datasetType, this.function);
  }

  static generateDisplay(
    datasetType: FlexDatasets,
    func: AggregateFunction
  ): AggregateDisplayTuple | undefined {
    return AggregateExpression.getDisplayMap(datasetType).get(func);
  }

  isValid(): boolean {
    switch (this.function) {
      case AggregateFunction.COUNT: {
        if (this.operator === AggregateOperators.BETWEEN) {
          return !!this.value.every(v => v);
        }

        return !!(this.operator && this.value[AggregateDisplayIndices.ONE]);
      }

      case AggregateFunction.AVG:
      case AggregateFunction.SUM: {
        if (this.operator === AggregateOperators.BETWEEN) {
          return !!this.value.every(v => v) && !!this.column;
        }

        return !!(
          this.operator &&
          this.value[AggregateDisplayIndices.ONE] &&
          this.column
        );
      }
    }
  }

  changeFunction(func: AggregateFunction) {
    if (!this.allowedFunctions.length || this.allowedFunctions.includes(func)) {
      this._function = func;
    }
  }

  changeOperator(op: AggregateOperators) {
    this.operator = op;
  }

  setColumn(columnName: string) {
    this.column = columnName;
  }

  equals(agg: AggregateExpression): boolean {
    return (
      this.value === agg.value &&
      this.column === agg.column &&
      this.operator === agg.operator &&
      this.function === agg.function
    );
  }
}

/**
 * A flex filter is a node used to filter customer data using fields
 * belonging to other datasets.
 */

export class FlexNode
  extends StemNode<FlexStemMetadata>
  implements IAudienceBuilderNode {
  readonly type = AudienceBuilderNodeTypes.FLEX;

  // Default values, to be overridden by a 'create' factory.
  level = LAYER_ROOT_KEY;
  index = 0;
  datasetId?: number;
  datasetGroupId = 0;
  datasetType: FlexDatasets = DatasetType.TRANSACTION;
  aggregateExpression: AggregateExpression = new AggregateExpression();

  protected nodeTypeConstraint: Set<AudienceBuilderNodeTypes> = new Set([
    AudienceBuilderNodeTypes.FILTER,
  ]);

  dataset(builder: IBuilder) {
    throw Error('Unimplemented.');
  }

  get treatAsFilter() {
    return true;
  }

  get metadata(): FlexStemMetadata {
    return {
      negate: this.negate,
      hasFilters: this.hasFilters,
      treatAsFilter: this.treatAsFilter,
      nodeTypeConstraint: Array.from(this.nodeTypeConstraint),
      operatorConstraint: this.operatorConstraint,
      nodes: Array.from(this.nodeIds),
      datasetType: this.datasetType,
      datasetGroupId: this.datasetGroupId,
      datasetId: this.datasetId,
      aggregate: {
        function: this.aggregateExpression.function,
        operator: this.aggregateExpression.operator,
        value: this.aggregateExpression.value,
        column: this.aggregateExpression.column,
      },
    };
  }

  isValid(): boolean {
    return !!(
      this.aggregateExpression.function &&
      this.aggregateExpression.operator &&
      typeof this.aggregateExpression.value !== 'undefined' &&
      this.datasetId
    );
  }

  updateAggregateExpression(
    mutation: (ex: AggregateExpression) => AggregateExpression
  ) {
    this.aggregateExpression = mutation(this.aggregateExpression);
    this.emitUpdateEvent(FlexUpdateContexts.UPDATE_AGGREGATE);
  }

  static fromStore(params: BuilderStoreNodeFactoryParams): FlexNode {
    const node = new FlexNode({id: params.id});
    const metadata = params.metadata as FlexStemMetadata;

    node.level = params.level || LAYER_ROOT_KEY;
    node.index = params.index || 0;

    if (metadata.nodes.length) {
      node.setNodeIds(metadata.nodes);
    }

    if (metadata.nodeTypeConstraint) {
      node.addConstraints(metadata.nodeTypeConstraint);
    }

    if (metadata.operatorConstraint) {
      node.operatorConstraint = metadata.operatorConstraint;
    }

    if (metadata.datasetId) {
      node.datasetId = metadata.datasetId;
    }

    if (metadata.datasetType) {
      node.datasetType = metadata.datasetType;
      node.aggregateExpression.datasetType = metadata.datasetType;
    }

    if (metadata.datasetGroupId) {
      node.datasetGroupId = metadata.datasetGroupId;
    }

    if (metadata.negate) {
      node.negate = metadata.negate;
    }

    if (metadata.aggregate) {
      node.updateAggregateExpression(ex => {
        const {aggregate} = metadata;
        ex.value = aggregate.value;
        ex.changeOperator(aggregate.operator);
        ex.changeFunction(aggregate.function);
        if (aggregate.column) ex.setColumn(aggregate.column);
        return ex;
      });
    }

    if (params.tags?.length) {
      node.tags = new Set(params.tags);
    }

    return node;
  }

  static create(params: {
    builder?: IBuilder;
    datasetId?: number;
    id?: string;
    level?: string;
    index?: number;
    operator?: NeighborOperators;
    datasetType?: FlexDatasets;
    expression?: AggregateExpression;
    datasetGroupId?: number; 
  }): FlexNode {
    const node = new FlexNode({id: params.id});
    const builder = params.builder;

    node.level = params.level || LAYER_ROOT_KEY;
    node.index = params.index || 0;

    if (params.datasetId) {
      node.datasetId = params.datasetId;
    }

    if (params.datasetGroupId) {
      node.datasetGroupId = params.datasetGroupId;
    }

    if (params.expression) {
      node.datasetType = params.expression.datasetType;
      node.aggregateExpression = params.expression;
    }

    if (params.operator) {
      node.operatorConstraint = params.operator;
    }

    if (params.datasetType) {
      node.datasetType = params.datasetType;
      node.aggregateExpression.datasetType = params.datasetType;
    }

    return node;
  }
}
