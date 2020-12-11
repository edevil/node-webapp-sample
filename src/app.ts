import { getKoaMiddleware } from "@emartech/cls-adapter";
import * as Koa from "koa";
import * as helmet from "koa-helmet";
import * as locale from "koa-locale";
import * as session from "koa-session";
import { config } from "./config";
import { graphqlInitializer } from "./initializers/graphql";
import { i18nInitializer } from "./initializers/i18n";
import { logger } from "./logger";
import { getAuthMW } from "./middleware/authentication";
import { getBinderMW } from "./middleware/bind-emitters";
import { getCORSMW } from "./middleware/cors-verifier";
import { requestLoggerMW } from "./middleware/request-logger";
import { getStaticMW } from "./middleware/static-content";
import { getTemplateEngine } from "./middleware/template-engine";
import { router } from "./routes";

export const app = new Koa();
app.keys = config.appKeys;
app.proxy = config.trustXHeaders;

app.use(getKoaMiddleware()).use(getBinderMW()).use(requestLoggerMW).use(helmet()).use(getCORSMW()).use(session(app));

locale(app);
i18nInitializer(app);

app.use(getAuthMW()).use(getTemplateEngine()).use(router.routes()).use(router.allowedMethods());

graphqlInitializer(app);

app.use(getStaticMW());

app.on("error", (err, ctx) => {
  logger.error("Error processing request", {
    exception_message: err.message,
    exception_stack: err.stack,
    requestId: ctx.state.requestId,
  });
});
