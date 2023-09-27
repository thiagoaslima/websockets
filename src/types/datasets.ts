/** Enum of valid dataset types. */
export enum DatasetType {
  USER = 'customer_details',
  TRANSACTION = 'transactions',
  EVENT = 'events',
}

export enum DatasetStatus {
  ACTIVE = 'active',
  AUTHORIZED = 'authorized',
}

export interface DatasetFieldMapping {
  [k: string]: string;
  email_field: string;
  mobile_device_id: string;
  client_customer_id: string;
  total_spend_denomination: 'dollars' | 'cents';
  total_spend_in_last_year: string;
}

export interface DatasetDefaultField {
  id: string;
  name: string;
  dataset: string;
  table: string;
  type: string;
  display_name: string;
  description?: string;
}

export interface DatasetGroup {
  id: number;
  name: string;
  description?: string | null;
  source_connection_id: number;
  team_id: number;
  datasets?: Dataset[];
  // audiences?: Audience[];
  default_personalizations: string[];
  marve_approval: boolean;
  settings?: {
    minimum_audience_export_size?: number;
    minimum_audience_report_size?: number;
  };
}

export interface DatasetLabel {
  id: number;
  section: string;
  display_name: string;
  field_name: string;
  field_type: string;
  created_at: string;
  updated_at: string;
  description: string;
}

export interface DatasetFieldLabel {
  id?: number | null;
  label_id: number;
  dataset_id?: number | null;
  dataset_field: string;
}

export interface JoinConfiguration {
  id?: number;
  flex_dataset_id?: number;
  dataset_group_id: number;
  customer_detail_id: number;
  config: {
    flex_join_keys: string[];
    customer_details_join_keys: string[];
  };
}

export enum EventDatasetCategory {
  WEB = 'web',
  MOBILE_APP = 'mobile_app',
  EMAIL = 'email',
  OTHER = 'other',
}

/** A union of all valid flex dataset. */
export type FlexDatasets = DatasetType.TRANSACTION | DatasetType.EVENT;

export interface Dataset {
  created_at: string;
  updated_at: string;
  id: number;
  name: string;
  description: string;
  dataset: string;
  platform_dataset: string;
  project_dataset: string;
  dataset_without_db: string;
  email_field_name: string;
  default_fields: string[];
  pii_fields: string[];
  default_field_objects: Record<string, DatasetDefaultField>[];
  /*
   * This field is the unique_field used before having composite keys
   * If it has value, it means the dataset was created before composite keys
   * and we will not allow to change the unique_field to be a composite key.
   **/
  original_unique_field: string;
  unique_fields: string[];
  project_id: string;
  dataset_type: DatasetType;
  source_connection_id: number;
  source_table: string;
  status: DatasetStatus;
  team_id: number;
  columns?: number;
  rows?: number;
  field_mapping: DatasetFieldMapping;
  dataset_groups?: DatasetGroup[];
  join_configurations?: JoinConfiguration[];
  flex_join_configurations?: JoinConfiguration[];
  category?: EventDatasetCategory;
  labels?: DatasetLabel[];
  dataset_field_labels?: DatasetFieldLabel[];
  audience_active_export_count: number;
  audience_export_count: number;
  audience_count: number;
  table_last_updated_at: string;
}
