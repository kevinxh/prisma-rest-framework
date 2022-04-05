import { Request, Response } from "express";
import { WithPrismaInterface, PrismaMixin } from "./client";
import Model from "./model";
import { applyMixins } from "./utils";
import { APIValidationError, APIInternalServerError } from "./errors";

const ErrorHandler = (target: any, propertyName: any, descriptor: any) => {
  const method = descriptor.value;

  descriptor.value = async function (...args: any) {
    const [req, res] = args as [Request, Response];
    try {
      return await method.apply(this, args);
    } catch (error: any) {
      if (error instanceof APIValidationError) {
        return res
          .status(APIValidationError.StatusCode)
          .json({ message: error.message, errors: error.errors });
      }
      res
        .status(APIInternalServerError.StatusCode)
        // TODO: for production environment, don't leak internal error
        // .json({ message: APIInternalServerError.message });
        .json({ message: error.message });
      console.error(error.stack);
    }
  };

  return descriptor;
};

interface View extends WithPrismaInterface {}
class View {
  ModelClass: typeof Model;
  model: Model;

  constructor(ModelClass: typeof Model) {
    this.ModelClass = ModelClass;
    this.model = new ModelClass();
  }
}
applyMixins(View, [PrismaMixin]);

interface ListMixin extends View, WithPrismaInterface {}
class ListMixin {
  // Note: mixins must not use class public fields
  // they will not work with how we apply mixins
  async list(req: Request, res: Response) {
    // @ts-ignore
    const list = await this.prisma[this.model.key].findMany();
    const filtered = list.map((instance: object) =>
      this.model.serialize(instance)
    );
    return filtered;
  }
}

interface CreateMixin extends View, WithPrismaInterface {}
class CreateMixin {
  async create(req: Request, res: Response) {
    const data = this.model.deserialize(req.body);
    // @ts-ignore
    const instance = await this.prisma[this.model.key].create({
      data,
    });
    const filtered = this.model.serialize(instance);
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
  constructor(ModelClass: typeof Model) {
    super(ModelClass);
    this.post = this.post.bind(this);
  }

  @ErrorHandler
  async post(req: Request, res: Response) {
    const isValid = this.model._validate(req.body);
    if (!isValid) {
      throw new APIValidationError(this.model.errors);
    }

    const result = await this.create(req, res);
    res.status(201).json(result);
  }
}
interface CreateView extends CreateMixin {}
applyMixins(CreateView, [CreateMixin]);

export { View, ListView, CreateView };
