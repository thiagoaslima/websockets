import {Static, Type} from '@sinclair/typebox';

export const JsonQuery = Type.Object({
  jsonQuery: Type.Required(Type.String()),
  schema: Type.Required(Type.Any()),
});

export const JsonQueryResponse = Type.String();

export type JsonQueryType = Static<typeof JsonQuery>;
export type JsonQueryResponseType = Static<typeof JsonQueryResponse>;
