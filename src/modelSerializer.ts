import { Prisma } from "@prisma/client";
import { withPrisma, WithPrismaInterface } from "./client";

interface Dictionary<T> {
  [key: string]: T;
}

interface ModelSerializer extends WithPrismaInterface {}

@withPrisma
class ModelSerializer {
  name: Prisma.ModelName | undefined;
  fields?: string[];
  validate?: (instace: any) => void;

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

  // There are 2 types of validations:
  // 1, object level - validate()
  // 2, field level - validate_{field}()
  // Invoke all validators and return an error message.
  // @ts-ignore
  _validate(instance) {
    this.validate && this.validate(instance);
    const fieldValidators = Object.getOwnPropertyNames(this).filter(
      (property) => /^validate_/.test(property)
    );
    fieldValidators.forEach((validator) => {
      const field = validator.replace("validate_", "");
      // @ts-ignore how to fix this type?
      this[validator](instance[field], instance);
    });
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
