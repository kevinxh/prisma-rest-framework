import { Request, Response } from "express";
import Model from "./model";
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

class View {
  ModelClass: typeof Model;
  model: Model;

  constructor(ModelClass: typeof Model) {
    this.ModelClass = ModelClass;
    this.model = new ModelClass();
  }
}

class DetailView extends View {
  lookupField: string = "id";
  constructor(ModelClass: typeof Model) {
    super(ModelClass);
  }

  getLookupParam(req: Request) {
    return req.params[this.lookupField];
  }
}

class ListView extends View {
  pageSize: number = 10;

  constructor(ModelClass: typeof Model) {
    super(ModelClass);
    this.get = this.get.bind(this);
  }

  getPageQuery(req: Request) {
    const page = req.query.page as string | undefined;
    const pageSize = req.query.pageSize as string | undefined;

    return {
      page: page ? parseInt(page) : 1,
      pageSize: pageSize ? parseInt(pageSize) : this.pageSize,
    };
  }

  @ErrorHandler
  async get(req: Request, res: Response) {
    const pageQuery = this.getPageQuery(req);
    const { page, pageSize } = pageQuery;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    let result = await this.model.list({ skip, take });
    if (!result) {
      result = [];
    }
    res.json({ data: result, count: result.length });
  }
}

class CreateView extends View {
  constructor(ModelClass: typeof Model) {
    super(ModelClass);
    this.post = this.post.bind(this);
  }

  @ErrorHandler
  async post(req: Request, res: Response) {
    const isValid = this.model.validateAll(req.body);
    if (!isValid) {
      throw new APIValidationError(this.model.errors);
    }

    const result = await this.model.create(req.body);
    res.status(201).json(result);
  }
}

class RetrieveView extends DetailView {
  constructor(ModelClass: typeof Model) {
    super(ModelClass);
    // TODO: this get conflicts with list view?
    this.get = this.get.bind(this);
  }

  @ErrorHandler
  async get(req: Request, res: Response) {
    const id = this.getLookupParam(req);
    const result = await this.model.retrieve(id);
    res.json(result);
  }
}

class UpdateView extends DetailView {
  constructor(ModelClass: typeof Model) {
    super(ModelClass);
    this.patch = this.patch.bind(this);
  }

  @ErrorHandler
  async patch(req: Request, res: Response) {
    // TODO: do we validate first or searlize first??
    const isValid = this.model.validateAll(req.body);
    if (!isValid) {
      throw new APIValidationError(this.model.errors);
    }

    const id = this.getLookupParam(req);
    const result = await this.model.update(id, req.body);
    res.json(result);
  }
}

class DestroyView extends DetailView {
  constructor(ModelClass: typeof Model) {
    super(ModelClass);
    this.delete = this.delete.bind(this);
  }

  @ErrorHandler
  async delete(req: Request, res: Response) {
    const id = this.getLookupParam(req);
    const result = await this.model.destroy(id);
    res.status(204).end();
  }
}

export { View, ListView, CreateView, RetrieveView, UpdateView, DestroyView };
