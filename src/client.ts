import { Prisma, PrismaClient } from "@prisma/client";
import { ListView, CreateView } from "./view";
import { Model } from "./model";

class PrismaRestFrameworkClient {
  //  TODO: find a better way to share client globally
  client: PrismaClient;
  constructor(client: PrismaClient) {
    this.client = client;
  }

  ListView(model: Prisma.ModelName | Model) {
    if (model instanceof Model) {
      return ListView(model, this.client);
    }
    return ListView(new Model(model), this.client);
  }

  CreateView(model: Prisma.ModelName | Model) {
    if (model instanceof Model) {
      return CreateView(model, this.client);
    }
    return CreateView(new Model(model), this.client);
  }
}

export default PrismaRestFrameworkClient;
