import { getContextStorage } from "@emartech/cls-adapter";
import chalk = require("chalk");
import * as winston from "winston";

const addContextFormat = winston.format((info, opts) => {
  const allInfo = { ...info, ...getContextStorage() };
  allInfo.severity = allInfo.level.toUpperCase();
  return allInfo;
});

function getLevelFunc(level: string) {
  switch (level) {
    case "info":
      return chalk.blue;
    case "error":
      return chalk.redBright;
    case "debug":
      return chalk.gray;
    case "warning":
      return chalk.yellowBright;
    default:
      return chalk.greenBright;
  }
}

const myFormat = winston.format.printf((info) => {
  const message = `${chalk.blueBright(info.timestamp)} ${getLevelFunc(info.level)(info.level)}: ${chalk.whiteBright(
    info.message.trim(),
  )}`;
  const extra = Object.keys(info)
    .filter((kname) => !["message", "level", "timestamp", "httpRequest"].includes(kname))
    .map((kname) => `[${chalk.magentaBright(kname)}: ${chalk.cyanBright(info[kname])}]`)
    .join(" ");
  return `${message} ${extra}`;
});

export const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    addContextFormat(),
    process.env.NODE_ENV !== "production" ? myFormat : winston.format.json(),
  ),
  level: "debug",
  transports: [new winston.transports.Console({ silent: process.env.NODE_ENV === "test" })],
});
