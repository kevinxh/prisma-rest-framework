import { Prisma, PrismaClient } from "@prisma/client";
import express, { Express, Request, Response } from "express";
import { listMixin } from "./mixins";

class View {}

const ListView = (client: PrismaClient, model: Lowercase<Prisma.ModelName>) => {
  return async (req: Request, res: Response) => {
    // @ts-ignore
    res.json(await client[model].findMany());
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
