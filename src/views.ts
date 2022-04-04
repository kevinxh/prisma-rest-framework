import { Prisma, PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { withPrisma, WithPrismaInterface, PrismaMixin } from "./client";
import ModelSerializer from "./modelSerializer";
import { applyMixins } from "./utils";

interface View extends WithPrismaInterface {}
class View {
  serializer: ModelSerializer;

  constructor(serializer: ModelSerializer) {
    this.serializer = serializer;
  }
}
applyMixins(View, [PrismaMixin]);

interface ListMixin extends View, WithPrismaInterface {}
class ListMixin {
  // Note: mixins must not use class public fields
  // they will not work with how we apply mixins
  async list(req: Request, res: Response) {
    // @ts-ignore
    const list = await this.prisma[this.serializer.key].findMany();
    const filtered = list.map((instance: object) =>
      this.serializer.filter(instance)
    );
    return filtered;
  }
}

interface CreateMixin extends View, WithPrismaInterface {}
class CreateMixin {
  async create(req: Request, res: Response) {
    this.serializer._validate(req.body);
    // @ts-ignore
    const instance = await this.prisma[this.serializer.key].create({
      data: req.body,
    });
    const filtered = this.serializer.filter(instance);
    return filtered;
  }
}

class ListView extends View {
  get = async (req: Request, res: Response) => {
    const result = await this.list(req, res);
    res.json(result);
  };
}
interface ListView extends ListMixin {}
applyMixins(ListView, [ListMixin]);

class CreateView extends View {
  post = async (req: Request, res: Response) => {
    const result = await this.create(req, res);
    res.status(201).json(result);
  };
}
interface CreateView extends CreateMixin {}
applyMixins(CreateView, [CreateMixin]);

// const ListView = (model: ModelSerializer, client: PrismaClient) => {
//   return async (req: Request, res: Response) => {
//     // @ts-ignore Every Prisma model has its own delegant type :(
//     const list = await client[model.key].findMany();
//     const filtered = list.map((instance: object) => model.filter(instance));
//     res.json(filtered);
//   };
// };

// const CreateView = (model: ModelSerializer, client: PrismaClient) => {
//   return async (req: Request, res: Response) => {
//     // @ts-ignore Every Prisma model has its own delegant type :(
//     const instance = await client[model.key].create({ data: req.body });
//     const filtered = model.filter(instance);
//     res.status(201).json(filtered);
//   };
// };

// const CreateView = (
//   client: PrismaClient,
//   model: Lowercase<Prisma.ModelName>
// ) => {
//   return async (req: Request, res: Response) => {
//     // @ts-ignore
//     const instance = await client[model].create({ data: req.body });
//     res.json(instance);
//   };
// };

export { View, ListView, CreateView };
