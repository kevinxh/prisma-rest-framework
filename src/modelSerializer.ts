import { Prisma } from "@prisma/client";
import { withPrisma, WithPrismaInterface } from "./client";

interface Dictionary<T> {
  [key: string]: T;
}

interface ModelSerializer extends WithPrismaInterface {}

@withPrisma
class ModelSerializer {
  fields: string[] = [];
  name: Prisma.ModelName | undefined;

  get _fields() {
    return this.fields || this.prismaFieldsArr.map((field) => field.name);
  }

  public get key() {
    return this.name?.toLowerCase() as Lowercase<Prisma.ModelName>;
  }

  private get prismaFieldsArr() {
    // @ts-ignore reading a private property _dmmf :(
    return (this.prisma._dmmf.modelMap as Dictionary<Prisma.DMMF.Model>)[
      this.name!
    ].fields;
  }

  // This function filters the object keys by this.fields
  // @ts-ignore How to refer to the dynamically generated Prisma model instance type?
  filter(instance) {
    const filtered = this._fields.reduce((prev, curr) => {
      if (curr in instance) {
        return Object.assign(prev, { [curr]: instance[curr] });
      }
      return prev;
    }, {});

    return filtered;
  }
}

export default ModelSerializer;
