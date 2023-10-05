import {
  FastifyReply,
  FastifyRequest,
  RawReplyDefaultExpression,
  RawRequestDefaultExpression,
  RawServerDefault,
} from 'fastify';

type ApiRequest<Body = void, Params = void, Reply = void> = {
  Body?: Body;
  Params?: Params;
  Reply: Reply;
};

type ApiResponse<Body = void, Params = void, Reply = {}> = FastifyReply<
  RawServerDefault,
  RawRequestDefaultExpression,
  RawReplyDefaultExpression,
  ApiRequest<Body, Params, Reply>
>;

type RouteHandlerMethod<Body = void, Params = void, Reply = void> = (
  request: FastifyRequest<ApiRequest<Body, Params, Reply>>,
  response: ApiResponse<Body, Params, Reply>
) => void;

export type DeleteRequestHandler<ReplyPayload> = RouteHandlerMethod<
  void,
  void,
  ReplyPayload
>;
export type GetRequestHandler<ReplyPayload> = RouteHandlerMethod<
  void,
  void,
  ReplyPayload
>;
export type PostRequestHandler<Payload, ReplyPayload> = RouteHandlerMethod<
  Payload,
  void,
  ReplyPayload
>;
export type PatchRequestHandler<Payload, ReplyPayload> = RouteHandlerMethod<
  Payload,
  void,
  ReplyPayload
>;
export type PutRequestHandler<Payload, ReplyPayload> = RouteHandlerMethod<
  Payload,
  void,
  ReplyPayload
>;
