import * as ratelimit from "koa-ratelimit";
import { getRedis } from "./initializers/redis";

const redisProxy = new Proxy(
  {},
  {
    get(target, propKey) {
      return getRedis()[propKey];
    },
  },
);

export const loginRLMW = ratelimit({
  db: redisProxy,
  disableHeader: false,
  duration: 10000,
  errorMessage: "Slow down",
  headers: {
    remaining: "Rate-Limit-Remaining",
    reset: "Rate-Limit-Reset",
    total: "Rate-Limit-Total",
  },
  id: (ctx) => ctx.ip,
  max: 10,
});
