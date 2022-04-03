import { Prisma, PrismaClient } from "@prisma/client";

interface Dictionary<T> {
  [key: string]: T;
}

class Model {
  #prismaFieldsArr: Prisma.DMMF.Field[];
  fields: string[];
  name: Prisma.ModelName | undefined;

  constructor(model: Prisma.ModelName, client: PrismaClient) {
    this.name = model;
    this.#prismaFieldsArr = // @ts-ignore
      (client._dmmf.modelMap as Dictionary<Prisma.DMMF.Model>)[model].fields;
    this.fields = this.#prismaFieldsArr.map((field) => field.name);
  }

  public get key() {
    return this.name?.toLowerCase() as Lowercase<Prisma.ModelName>;
  }

  // @ts-ignore
  filter(instance) {
    // Object.fromEntries(Object.entries(instance).filter(([key]) => key.includes('Name')));
    const filtered = this.fields.reduce((prev, curr) => {
      if (curr in instance) {
        return Object.assign(prev, { [curr]: instance[curr] });
      }
      return prev;
    }, {});

    console.log(filtered);

    return filtered;
  }
}

export { Model };
