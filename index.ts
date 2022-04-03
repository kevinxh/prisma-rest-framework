import { PrismaClient } from "@prisma/client";
import express, { Express, Request, Response } from "express";
import { Model } from "./src/model";
import PrismaRestFramework from "./src/client";

const prisma = new PrismaClient();
const PRF = new PrismaRestFramework(prisma);

const app: Express = express();
const port = 3002;

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("⚡️ Prisma Server");
});

class User extends Model {
  fields = ["name", "email"];
}

app.get("/users", PRF.ListView(new User()));
app.get("/books", PRF.ListView("Book"));
// app.post("/users", CreateView(prisma, "user"));

// app.get("/users", ListView(prisma.user));
// app.post("/users", CreateView(prisma.user));
// app.get("/users/:id", RetrieveView(prisma.user));
// app.patch("/users/:id", UpdateView(prisma.user));
// app.delete("/users/:id", DestroyView(prisma.user));

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
