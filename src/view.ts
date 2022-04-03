import { Prisma, PrismaClient } from "@prisma/client";
import express, { Express, Request, Response } from "express";
import { listMixin } from "./mixins";
import { Model } from "./model";

class View {}

const ListView = (model: Model, client: PrismaClient) => {
  return async (req: Request, res: Response) => {
    // @ts-ignore
    const list = await client[model.key].findMany();
    const filtered = list.map((instance: object) => model.filter(instance));
    res.json(filtered);
    // console.log(model.filter(result[0]));
    // console.log(result);
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
