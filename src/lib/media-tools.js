import fs from "fs-extra";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const { readJSON, writeJSON, writeFile, createReadStream } = fs;

const dataFolderPath = join(dirname(fileURLToPath(import.meta.url)), "../data");

/* const publicFolderPath = join(process.cwd(), "./public/img/medias"); */

const mediaJSONPath = join(dataFolderPath, "media.json");
console.log(mediaJSONPath);

export const getMedias = () => readJSON(mediaJSONPath);
export const writeMedias = (content) => writeJSON(mediaJSONPath, content);

export const saveMediasPictures = (filename, contentAsButter) =>
  writeFile(join(publicFolderPath, filename), contentAsButter);

export const getMediasReadableStream = () => createReadStream(mediaJSONPath);
