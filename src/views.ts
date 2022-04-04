import { Request, Response } from "express";
import { WithPrismaInterface, PrismaMixin } from "./client";
import ModelSerializer from "./modelSerializer";
import { applyMixins } from "./utils";
import { APIValidationError, APIInternalServerError } from "./errors";

const ErrorHandler = (target: any, propertyName: any, descriptor: any) => {
  const method = descriptor.value;

  descriptor.value = async function (...args: any) {
    const [req, res] = args as [Request, Response];
    try {
      return await method.apply(this, args);
    } catch (error) {
      if (error instanceof APIValidationError) {
        res
          .status(APIValidationError.StatusCode)
          .json({ message: error.message, errors: error.errors });
      }
      res
        .status(APIInternalServerError.StatusCode)
        .json({ message: APIInternalServerError.message });
    }
  };

  return descriptor;
};

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
  constructor(serializer: ModelSerializer) {
    super(serializer);
    this.post = this.post.bind(this);
  }

  @ErrorHandler
  async post(req: Request, res: Response) {
    const isValid = this.serializer._validate(req.body);
    if (!isValid) {
      throw new APIValidationError(this.serializer.errors);
    }

    const result = await this.create(req, res);
    res.status(201).json(result);
  }
}
interface CreateView extends CreateMixin {}
applyMixins(CreateView, [CreateMixin]);

export { View, ListView, CreateView };
