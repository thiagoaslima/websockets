/**
 * A JSON query with multiple filters.
 */
export const multiFilterJSONQuery = `{
  "queries": {
    "base_query": {
      "fields": {
        "customer_id": "demo.customers.customer_id"
      },
      "filter": {
        "and": [
          {
            "operator": "is_not_null",
            "field_name": "demo.customers.email",
            "field_value": ""
          },
          {
            "operator": "equals",
            "field_name": "demo.customers.city",
            "field_value": [
              "Aiken",
              "Akron",
              "Albany",
              "Albuquerque",
              "Alexandria"
            ]
          },
          {
            "operator": "equals",
            "field_name": "demo.customers.state",
            "field_value": [
              "New York"
            ]
          },
          {
            "operator": "greater_than",
            "field_name": "demo.customers.total_quantity_of_purchases",
            "field_value": 3
          },
          {
            "operator": "greater_than",
            "field_name": "demo.customers.total_purchase_value",
            "field_value": 0
          }
        ]
      }
    }
  },
  "operation": "base_query",
  "result_query": {
    "join": [
      {
        "on": [
          {
            "operation.customer_id": "demo.customers.customer_id"
          }
        ],
        "left": "operation",
        "type": "left",
        "right": "demo.customers"
      }
    ],
    "fields": {
      "customer_id": "operation.customer_id"
    }
  }
}` as const;
