import { Prisma, PrismaClient, User } from "@prisma/client";
import express, { Express, Request, Response } from "express";
import ModelSerializer from "./src/modelSerializer";
import PrismaRestFrameworkClient from "./src/client";
import { ListView, CreateView } from "./src/views";

const prisma = new PrismaClient();
PrismaRestFrameworkClient.init(prisma);

const app: Express = express();
const port = 3002;

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("⚡️ Prisma Server");
});

class UserSerializer extends ModelSerializer {
  name = "User" as Prisma.ModelName;
  fields = ["name", "email"];
  validate = (instance: User) => {
    console.log("validate");
    console.log(instance);
  };
  validate_email = (email: User["email"], instance: User) => {
    console.log("validate_email");
    console.log(email);
    console.log(instance);
  };
}

const userSerializer = new UserSerializer();

const userListView = new ListView(userSerializer);
const userCreateView = new CreateView(userSerializer);

app.get("/users", userListView.get);
app.post("/users", userCreateView.post);
// app.post("/users", PRF.CreateView(new User()));
// app.get("/books", PRF.ListView("Book"));
// app.post("/users", CreateView(prisma, "user"));

// app.get("/users", ListView(prisma.user));
// app.post("/users", CreateView(prisma.user));
// app.get("/users/:id", RetrieveView(prisma.user));
// app.patch("/users/:id", UpdateView(prisma.user));
// app.delete("/users/:id", DestroyView(prisma.user));

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
