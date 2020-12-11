import * as fs from "fs";
import { logger } from "../../logger";

export const exampleMutations = {
  async uploadFile(obj, { image }, { ctx }, info) {
    const { filename, mimetype, createReadStream } = await image;
    const stream = createReadStream();

    logger.debug("Got upload", { filename, mimetype });
    const myFile = fs.createWriteStream("output");
    const promise = new Promise((resolve, reject) => {
      stream
        .on("error", (err) => {
          logger.info("Could not read file", { err });
          myFile.close();
          reject(err);
        })
        .on("end", () => {
          logger.debug("Only finished now");
          resolve();
        })
        .pipe(myFile);
    });
    await promise;

    stream.close();
    return true;
  },
};
