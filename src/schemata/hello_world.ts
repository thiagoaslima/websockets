import {Static, Type} from '@sinclair/typebox';

export const HelloWorld = Type.Object({
  geeting: Type.String(),
});

export type HelloWorldType = Static<typeof HelloWorld>;
