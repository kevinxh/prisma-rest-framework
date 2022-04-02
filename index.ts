import { PrismaClient } from "@prisma/client";
import express, { Express, Request, Response } from "express";
import { ListView, CreateView } from "./src/view";

const prisma = new PrismaClient();

const app: Express = express();
const port = 3002;

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("⚡️ Prisma Server");
});

app.get("/users", ListView(prisma, "user"));
app.post("/users", CreateView(prisma, "user"));

// app.get("/users", ListView(prisma.user));
// app.post("/users", CreateView(prisma.user));
// app.get("/users/:id", RetrieveView(prisma.user));
// app.patch("/users/:id", UpdateView(prisma.user));
// app.delete("/users/:id", DestroyView(prisma.user));

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});

// const prisma = new PrismaClient();

// async function main() {
//   const allUsers = await prisma.user.findMany();
//   console.log(allUsers);
// }

// main()
//   .catch((e) => {
//     throw e;
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });
