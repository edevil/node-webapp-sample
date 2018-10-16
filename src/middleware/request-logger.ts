import * as bytes from "bytes";
import * as Counter from "passthrough-counter";
import { logger } from "../logger";

export const requestLoggerMW = async (ctx, next) => {
  const start = Date.now();

  try {
    await next();
  } catch (err) {
    // log uncaught downstream errors
    log(ctx, start, null, err, null);
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

  const onfinish = done.bind(null, "finish");
  const onclose = done.bind(null, "close");

  res.once("finish", onfinish);
  res.once("close", onclose);

  function done(event) {
    res.removeListener("finish", onfinish);
    res.removeListener("close", onclose);
    log(ctx, start, counter ? counter.length : length, null, event);
  }
};

function log(ctx, start, len, err, event) {
  const delta = Date.now() - start;
  const latency = delta / 1000 + "s";

  // get the status code of the response
  const status = err ? (err.isBoom ? err.output.statusCode : err.status || 500) : ctx.status || 404;

  // get the human readable response length
  let length;
  if ([204, 205, 304].includes(status)) {
    length = "";
  } else if (len == null) {
    length = "-";
  } else {
    length = bytes(len).toLowerCase();
  }

  logger.info("Request finished", {
    event: event || "-",
    ip: ctx.ip,
    latency,
    length,
    method: ctx.method,
    status,
    url: ctx.originalUrl,
  });
}
