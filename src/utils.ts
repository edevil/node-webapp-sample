import * as jwt from "jsonwebtoken";
import { config } from "./config";
import { User } from "./entities/user";
import { logger } from "./logger";
import { addSuccess } from "./messages";

export async function afterLogin(ctx, user, router) {
  await ctx.login(user);
  let nextUrl;
  if (ctx.session.nextUrl) {
    nextUrl = ctx.session.nextUrl;
    ctx.session.nextUrl = null;
  } else {
    nextUrl = router.url("index");
  }
  logger.info("Login successful", { user_id: user.id, next_url: nextUrl });
  addSuccess(ctx, "Login successful");
  ctx.redirect(nextUrl);
}

export function getGQLContext(user: User = null): { ctx: any } {
  if (user) {
    return {
      ctx: {
        isAuthenticated() {
          return true;
        },
        i18n: {
          __(...args) {
            return args.join(" ");
          },
        },
        state: {
          user,
        },
      },
    };
  } else {
    return {
      ctx: {
        isAuthenticated() {
          return false;
        },
        i18n: {
          __(...args) {
            return args.join(" ");
          },
        },
      },
    };
  }
}

export function addParamsToURL(url: string, params: Map<string, string | string[]>): string {
  const isRelative: boolean = url.startsWith("/");
  const base = isRelative ? config.baseURL : null;

  const reducer = (tempUrl, [key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((val) => tempUrl.searchParams.append(key, val));
    } else {
      tempUrl.searchParams.append(key, value);
    }
    return tempUrl;
  };

  const newUrl = [...params.entries()].reduce(reducer, new URL(url, base));
  return isRelative ? newUrl.pathname + newUrl.search : newUrl.href;
}

export function generateUserToken(user: User): string {
  return jwt.sign({ userId: user.id }, config.appKeys[0], { expiresIn: config.tokenLifetime });
}
