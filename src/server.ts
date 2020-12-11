import { createTerminus } from "@godaddy/terminus";
import * as Sentry from "@sentry/node";
import * as http from "http";
import { getConnection } from "typeorm";
import { app } from "./app";
import { config } from "./config";
import { databaseInitializer } from "./initializers/database";
import { graphqlInstall, shutdownSubscriptions } from "./initializers/graphql";
import { closeRedis, initRedis } from "./initializers/redis";
import { closeWebsocket, initWebsocket } from "./initializers/websocket";
import { logger } from "./logger";

logger.info("Startup server");

Sentry.init({ dsn: config.ravenDSN });

function onSignal() {
  logger.info("server is starting cleanup");

  return Promise.all([
    getConnection().close(),
    Promise.resolve(closeRedis()),
    Promise.resolve(closeWebsocket()),
    Promise.resolve(shutdownSubscriptions()),
  ]);
}

async function onShutdown() {
  logger.info("cleanup finished, server is shutting down");
}

function healthCheck() {
  return Promise.resolve(getConnection().manager.query("SELECT 1 AS OK"));
}

function beforeShutdown() {
  logger.debug("Will setup shutdown timer");
  return new Promise((resolve) => {
    setTimeout(resolve, 5000);
  });
}

function doLog(msg: string, err: Error): void {
  logger.error(msg, { err });
}

const options = {
  beforeShutdown,
  doLog,
  healthChecks: {
    "/healthcheck": healthCheck,
  },
  onShutdown,
  onSignal,
  timeout: 1000,
};

const bootstrap = async () => {
  await databaseInitializer();
  initRedis();

  const server = http.createServer(app.callback());
  createTerminus(server, options);
  initWebsocket(server, app);
  graphqlInstall(server);

  app.on("error", (err, ctx) => {
    Sentry.withScope((scope) => {
      scope.addEventProcessor(async (event) => {
        Sentry.Handlers.parseRequest(event, ctx.request);
        event.extra.request_id = ctx.state.requestId;
        return event;
      });
      Sentry.captureException(err);
    });
  });

  server.listen(config.port);
};

bootstrap().catch((err) => {
  logger.error("Error on server", {
    exception_message: err.message,
    exception_stack: err.stack,
  });
});
