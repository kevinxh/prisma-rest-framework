import { Prisma, PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { Model } from "./model";

class View {}

const ListView = (model: Model, client: PrismaClient) => {
  return async (req: Request, res: Response) => {
    // @ts-ignore Every Prisma model has its own delegant type :(
    const list = await client[model.key].findMany();
    const filtered = list.map((instance: object) => model.filter(instance));
    res.json(filtered);
  };
};

const CreateView = (
  client: PrismaClient,
  model: Lowercase<Prisma.ModelName>
) => {
  return async (req: Request, res: Response) => {
    // @ts-ignore
    const instance = await client[model].create({ data: req.body });
    res.json(instance);
  };
};

export { View, ListView, CreateView };
