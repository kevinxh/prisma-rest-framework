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

interface IRetrieveMixinOptions {
  idParam: string;
}
interface RetrieveMixin extends View, WithPrismaInterface {}
class RetrieveMixin {
  idParam = "id";
  async retrieve(req: Request, res: Response, options?: IRetrieveMixinOptions) {
    const param = options?.idParam || this.idParam;
    const uniqueIdField = this.model.uniqueIdField;

    // TODO: handle record not found situation
    // @ts-ignore
    const instance = await this.prisma[this.model.key].findUnique({
      where: {
        // what about strings?
        // TODO: replace Number()
        [uniqueIdField]: Number(req.params[param]),
      },
    });
    const filtered = this.model.serialize(instance);
    return filtered;
  }
}

interface UpdateMixin extends View, WithPrismaInterface {}
class UpdateMixin {
  idParam = "id";
  async update(req: Request, res: Response, options?: IRetrieveMixinOptions) {
    const param = options?.idParam || this.idParam;
    const uniqueIdField = this.model.uniqueIdField;

    const data = this.model.deserialize(req.body);

    // TODO: handle record not found situation, handle invalid update (e.g. unique fields)
    // @ts-ignore
    const instance = await this.prisma[this.model.key].update({
      where: {
        // what about strings?
        // TODO: replace Number()
        [uniqueIdField]: Number(req.params[param]),
      },
      data,
    });
    const filtered = this.model.serialize(instance);
    return filtered;
  }
}

interface DestroyMixin extends View, WithPrismaInterface {}
class DestroyMixin {
  idParam = "id";
  async destroy(req: Request, res: Response, options?: IRetrieveMixinOptions) {
    const param = options?.idParam || this.idParam;
    const uniqueIdField = this.model.uniqueIdField;

    // TODO: handle record not found situation, handle invalid update (e.g. unique fields)
    // @ts-ignore
    const instance = await this.prisma[this.model.key].delete({
      where: {
        // what about strings?
        // TODO: replace Number()
        [uniqueIdField]: Number(req.params[param]),
      },
    });
    const filtered = this.model.serialize(instance);
    return filtered;
  }
}

class ListView extends View {
  constructor(ModelClass: typeof Model) {
    super(ModelClass);
    this.get = this.get.bind(this);
  }

  @ErrorHandler
  async get(req: Request, res: Response) {
    const result = await this.list(req, res);
    res.json(result);
  }
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

class RetrieveView extends View {
  mixinOptions?: IRetrieveMixinOptions;

  constructor(ModelClass: typeof Model, mixinOptions?: IRetrieveMixinOptions) {
    super(ModelClass);
    // TODO: this get conflicts with list view?
    this.get = this.get.bind(this);
    this.mixinOptions = mixinOptions;
  }

  @ErrorHandler
  async get(req: Request, res: Response) {
    const result = await this.retrieve(req, res, this.mixinOptions);
    res.json(result);
  }
}
interface RetrieveView extends RetrieveMixin {}
applyMixins(RetrieveView, [RetrieveMixin]);

class UpdateView extends View {
  mixinOptions?: IRetrieveMixinOptions;

  constructor(ModelClass: typeof Model, mixinOptions?: IRetrieveMixinOptions) {
    super(ModelClass);
    this.patch = this.patch.bind(this);
    this.mixinOptions = mixinOptions;
  }

  @ErrorHandler
  async patch(req: Request, res: Response) {
    // TODO: do we validate first or searlize first??
    const isValid = this.model._validate(req.body);
    if (!isValid) {
      throw new APIValidationError(this.model.errors);
    }
    const result = await this.update(req, res, this.mixinOptions);
    res.json(result);
  }
}
interface UpdateView extends UpdateMixin {}
applyMixins(UpdateView, [UpdateMixin]);

class DestroyView extends View {
  mixinOptions?: IRetrieveMixinOptions;

  constructor(ModelClass: typeof Model, mixinOptions?: IRetrieveMixinOptions) {
    super(ModelClass);
    this.delete = this.delete.bind(this);
    this.mixinOptions = mixinOptions;
  }

  @ErrorHandler
  async delete(req: Request, res: Response) {
    const result = await this.destroy(req, res, this.mixinOptions);
    res.status(204).end();
  }
}
interface DestroyView extends DestroyMixin {}
applyMixins(DestroyView, [DestroyMixin]);

export { View, ListView, CreateView, RetrieveView, UpdateView, DestroyView };
