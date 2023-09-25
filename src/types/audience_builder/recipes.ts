import {
  AudienceBuilderNodeTypes,
  ExpressionOperators,
  ExpressionValueTuple,
  ValidExpressionValue,
} from './index';
import {YAMLResult} from '@v2/lib/yaml_parser';

/** All possible values for secton "extends." */
export enum RecipeSectionExtends {
  DATASETS = 'datasets',
  AUDIENCES = 'audiences',
  CUSTOMERS = 'customers',
}

/** Categories for all recipes. */
export enum RecipeCategories {
  PURCHASES = 'purchases',
  CHURN = 'churn',
}

export type ValidRecipeExt = RecipeSectionExtends[keyof RecipeSectionExtends];

/** Front matter literal for recipes. */
export type RecipeFrontMatter = {
  name: string;
  description: string;
  required_labels: string[];
  categories?: RecipeCategories[];
  recommended?: boolean;
};

/**
 * Valid filter keys for recipe sections; should evaluate to lowercased versions
 * of NeighborOperators.
 */
export enum RecipeFilterKeys {
  AND = 'and',
  OR = 'or',
}

/** A recipe's representation of a filter expression. */
export type RecipeExpression = {
  label: string;
  operator: ExpressionOperators;
  value?: ValidExpressionValue | ExpressionValueTuple<ValidExpressionValue>;
};

/** The recipe equivalent of a filter node. */
export type RecipeFilter = {
  [Key in RecipeFilterKeys]: RecipeExpression[];
};

/** Literal for recipe section data. */
export type RecipeSection = {
  title: string;
  description?: string;
  filters?: RecipeFilter[];
  extends?: RecipeSectionExtends;
  constraint?: AudienceBuilderNodeTypes;
};

/** A sub-type of RecipeSection used for extends. */
export type RecipeSectionExt = RecipeSection & {
  title?: string;
  description?: string;
  /**
   * Which section type to inherit from the default template;
   * ie., datasets, audiences, or customers.
   */
  extends: ValidRecipeExt;
};

/** Parsed YAML result for a recipe. */
export type RecipeResult = YAMLResult<RecipeFrontMatter, RecipeSection[]>;

/**
 * Validation result for the recipe manager..
 */
export interface IRecipeValidation<Ctx = unknown> {
  /** Whether or not the given validation is valid.*/
  valid: boolean;
  /** A status especially useful for diagnosing invalid states. */
  tags: Set<string>;
  /** Contextual data associated with the validation kind. */
  ctx?: Ctx;
  /** The reason why the validation is invalid. */
  err?: Error;
}
