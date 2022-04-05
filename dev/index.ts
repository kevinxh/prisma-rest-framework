import { Prisma, PrismaClient, User } from "@prisma/client";
import express, { Express, Request, Response } from "express";
import Model from "../src/model";
import PrismaRestFrameworkClient from "../src/client";
import {
  ListView,
  CreateView,
  RetrieveView,
  UpdateView,
  DestroyView,
} from "../src/views";
import { ValidationError } from "../src/errors";

const prisma = new PrismaClient();
PrismaRestFrameworkClient.init(prisma);

const app: Express = express();
const port = 3002;

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("⚡️ Prisma Server");
});

class UserModel extends Model {
  name = "User" as Prisma.ModelName;
  fields = ["id", "name", "email"];

  // required fields by default are those Prisma field that
  // is not marked as optional (?) and do not have default
  // you can also manually add required fields here
  requiredFields = ["name", "email"];
  validate = (instance: User) => {
    // throw new ValidationError("data is wrong!");
  };
  validate_email = (email: User["email"], instance: User) => {
    // throw new ValidationError("email is bad!");
  };
}

const userListView = new ListView(UserModel);
const userCreateView = new CreateView(UserModel);
const userRetrieveView = new RetrieveView(UserModel, {
  idParam: "userId",
});
const userUpdateView = new UpdateView(UserModel, {
  idParam: "userId",
});
const userDestroyView = new DestroyView(UserModel, {
  idParam: "userId",
});

app.get("/users", userListView.get);
app.post("/users", userCreateView.post);
app.get("/users/:userId", userRetrieveView.get);
app.patch("/users/:userId", userUpdateView.patch);
app.delete("/users/:userId", userDestroyView.delete);
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
