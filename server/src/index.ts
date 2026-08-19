import "dotenv/config";
import cors from "cors";
import express from "express";
import { dmRouter } from "./dm/route.js";

const app = express();
const port = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

app.get("/api/hello", (_req, res) => {
  res.json({ message: "Hello from the Dungeon Master." });
});

app.use("/api/dm", dmRouter);

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
