import {FullSchemaResponse} from '../../../types/schemas.js';

/**
 * An example response from the full schema on querivce.
 */
export const schemaResponse: FullSchemaResponse = {
  data: {
    datasets: [
      {
        name: 'demo',
        tables: [
          {
            name: 'customers',
            fields: [
              {name: 'customer_id', source_type: 'STRING'},
              {name: 'city', source_type: 'STRING'},
              {name: 'state', source_type: 'STRING'},
              {name: 'email', source_type: 'STRING'},
              {name: 'total_quantity_of_purchases', source_type: 'INTEGER'},
              {name: 'total_purchase_value', source_type: 'INTEGER'},
            ],
          },
        ],
      },
    ],
  },
};
