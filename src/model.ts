import { Prisma, PrismaClient } from "@prisma/client";

interface Dictionary<T> {
  [key: string]: T;
}

class Model {
  fields: string[] = [];
  client: PrismaClient;
  name: Prisma.ModelName;

  constructor(model?: Prisma.ModelName, client?: PrismaClient) {
    // TODO: the class relys on subclass constructor name to avoid having tedious
    // initialization like: new User('User') we don't want to pass the model name
    // as argument.
    this.name = model || (this.constructor.name as Prisma.ModelName);
    this.client = client || new PrismaClient();
    this.fields = this.prismaFieldsArr.map((field) => field.name);
  }

  public get key() {
    return this.name?.toLowerCase() as Lowercase<Prisma.ModelName>;
  }

  private get prismaFieldsArr() {
    // @ts-ignore reading a private property _dmmf :(
    return (this.client._dmmf.modelMap as Dictionary<Prisma.DMMF.Model>)[
      this.name!
    ].fields;
  }

  // @ts-ignore How to refer to the dynamically generated Prisma model instance type?
  filter(instance) {
    const filtered = this.fields.reduce((prev, curr) => {
      if (curr in instance) {
        return Object.assign(prev, { [curr]: instance[curr] });
      }
      return prev;
    }, {});

    return filtered;
  }
}

export { Model };
