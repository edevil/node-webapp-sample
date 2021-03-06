import { getMessages } from "../messages";

export const getMessagesMW = () => async (ctx, next) => {
  ctx.state.messages = getMessages(ctx);
  await next();
};
