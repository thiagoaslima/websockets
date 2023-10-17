import {JsonQueryType, JsonQueryResponseType} from '../schemata/json_query.js';
import {PostRequestHandler} from '../types/handlers.js';
import {transform} from '../transformations/json_query.js';

export const transformJsonQuery: PostRequestHandler<
  JsonQueryType,
  JsonQueryResponseType
> = async (request, reply) => {
  try {
    // If body is not provided throw error
    if (!request.body) {
      return reply.status(400).send('Invalid request: body was empty.');
    }

    const {jsonQuery, schema} = request.body;
    const builder = await transform(JSON.stringify(jsonQuery), schema);
    return reply.status(200).send(builder.graphJSON());
  } catch (error) {
    console.error(error);
    return reply
      .status(500)
      .send(error instanceof Error ? error.message : 'Server error');
  }
};
