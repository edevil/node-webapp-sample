import { logger } from "logger";
import { createNamespace } from "@emartech/cls-adapter";
import * as Counter from "passthrough-counter";
import * as humanize from "humanize-number";
import * as bytes from "bytes";

async function reqLogger(ctx, next) {
  logger.info("Request started", { method: ctx.method, url: ctx.originalUrl });
  const start = Date.now();

  try {
    await next();
  } catch (err) {
    // log uncaught downstream errors
    log(ctx, start, null, err);
    throw err;
  }

  // calculate the length of a streaming response
  // by intercepting the stream with a counter.
  // only necessary if a content-length header is currently not set.
  const length = ctx.response.length;
  const body = ctx.body;
  let counter;
  if (length == null && body && body.readable) {
    ctx.body = body.pipe((counter = Counter())).on("error", ctx.onerror);
  }

  // log when the response is finished or closed,
  // whichever happens first.
  const res = ctx.res;

  const onfinish = createNamespace().bind(done.bind(null, "finish"));
  const onclose = createNamespace().bind(done.bind(null, "close"));

  res.once("finish", onfinish);
  res.once("close", onclose);

  function done(event) {
    res.removeListener("finish", onfinish);
    res.removeListener("close", onclose);
    log(ctx, start, counter ? counter.length : length, null, event);
  }
}

function log(ctx, start, len, err, event = null) {
  // get the status code of the response
  const status = err ? (err.isBoom ? err.output.statusCode : err.status || 500) : ctx.status || 404;

  // get the human readable response length
  let length;
  if (~[204, 205, 304].indexOf(status)) {
    length = "";
  } else if (len == null) {
    length = "-";
  } else {
    length = bytes(len).toLowerCase();
  }

  const result = err ? "errored" : event;
  logger.info("Request finished", {
    method: ctx.method,
    url: ctx.originalUrl,
    status,
    time: time(start),
    length,
    result,
  });
}

function time(start) {
  const delta = Date.now() - start;
  return humanize(delta < 10000 ? delta + "ms" : Math.round(delta / 1000) + "s");
}

export const getRequestLogger = () => reqLogger;
