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
const app: Express = express();
const port = 3002;
app.use(express.json());
app.get("/", (req: Request, res: Response) => {
  res.send("⚡️ Prisma Rest Framework");
});

// Step.1 initialize the framework using Prisma client
PrismaRestFrameworkClient.init(prisma);

// Step.2a declare your model (optional)
class UserModel extends Model {
  name = "User" as Prisma.ModelName;
  fields = ["id", "name", "email"];
  requiredFields = ["name", "email"];
  validate = (instance: User) => {
    // this validates the entire request body
  };
  validate_email = (email: User["email"], instance: User) => {
    // this validates individual fields
  };
}

// Step.2b extend views (optional)
class PaginatedListView extends ListView {
  pageSize = 5;
}

// Step.3 create express endpoints to use the views
const userListView = new PaginatedListView(UserModel);
const userCreateView = new CreateView(UserModel);
const userRetrieveView = new RetrieveView(UserModel);
const userUpdateView = new UpdateView(UserModel);
const userDestroyView = new DestroyView(UserModel);
app.get("/users", userListView.get);
app.post("/users", userCreateView.post);
app.get("/users/:id", userRetrieveView.get);
app.patch("/users/:id", userUpdateView.patch);
app.delete("/users/:id", userDestroyView.delete);

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
