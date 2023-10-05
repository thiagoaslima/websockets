export type DatasetSchema = {
  name: string;
  description?: string;
  tables: TableSchema[];
};

export type TableSchema = {
  name: string;
  description?: string;
  fields: FieldSchema[];
};

export type FieldSchema = {
  name: string;
  description?: string;
  fw_type?: string;
  type: string;
};

export type FullSchemaResponse = {
  data: {datasets: DatasetSchema[]};
};
