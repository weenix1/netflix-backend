import express from "express";
import cors from "cors";
import listEndpoints from "express-list-endpoints";
import {
  genericErrorHandler,
  badRequestHandler,
  unauthorizedHandler,
  notFoundHandler,
} from "./errorsHandler.js";

import { join } from "path";
import mediaRouter from "./services/media/index.js";

const publicFolderPath = join(process.cwd(), "./public");

const whitelist = [process.env.FE_LOCAL_URL, process.env.FE_PROD_URL];
const corsOpts = {
  origin: function (origin, next) {
    // Since CORS is a global middleware, it is going to be executed for each and every request --> we are able to "detect" the origin of each and every req from this function
    console.log("CURRENT ORIGIN: ", origin);
    if (!origin || whitelist.indexOf(origin) !== -1) {
      // If origin is in the whitelist or if the origin is undefined () --> move ahead
      next(null, true);
    } else {
      // If origin is NOT in the whitelist --> trigger a CORS error
      next(new Error("CORS ERROR"));
    }
  },
};

const server = express();
server.use(express.static(publicFolderPath));

server.use(express.json());
server.use(cors(corsOpts));
server.use("/media", mediaRouter);

server.use(badRequestHandler);
server.use(unauthorizedHandler);
server.use(notFoundHandler);
server.use(genericErrorHandler);

const port = process.env.PORT;
console.log(process.env);
console.table(listEndpoints(server));

server.listen(port, () => {
  console.log("server running on port:", port);
});
