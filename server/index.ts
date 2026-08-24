import "dotenv/config";
import { createServer } from "http";
import { createApp } from "./app";

const port = Number(process.env.PORT || 3000);
createServer(createApp()).listen(port, () => console.log(`Server running on http://localhost:${port}/`));
