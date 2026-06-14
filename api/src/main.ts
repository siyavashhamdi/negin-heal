// Load .env file first, before any other imports
import { config } from "dotenv";
config();

import { bootstrap } from "./bootstrap";
bootstrap();
