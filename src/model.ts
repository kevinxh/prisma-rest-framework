import { Prisma } from "@prisma/client";
import { Request, Response } from "express";
import { withPrisma, WithPrismaInterface } from "./client";
import { ValidationError } from "./errors";
import { FindMany } from "./querys";
import { IValidationError } from "./types";

interface Dictionary<T> {
  [key: string]: T;
}

enum PrismaIDFieldTypes {
  Int = "Int",
  String = "String",
}

interface Model extends WithPrismaInterface {}

@withPrisma
class Model {
  name: Prisma.ModelName | undefined;
  fields?: string[];
  requiredFields?: string[];
  uniqueIdField: string = "id";
  validate?: (instace: any) => void;
  private _validated = false;
  private _errors: IValidationError[] = [];

  public get key() {
    return this.name?.toLowerCase() as Lowercase<Prisma.ModelName>;
  }

  public get isValid() {
    return this._validated && this._errors.length === 0;
  }

  public get isValidated() {
    return this._validated;
  }

  public get errors() {
    return this._errors;
  }

  private get _fields() {
    return this.fields || this._allFields;
  }

  private get _allFields() {
    return this._prismaFieldDetailList.map((field) => field.name);
  }

  private get _requiredFields() {
    return new Set([
      ...this._prismaFieldDetailList
        .filter((field) => field.isRequired && !field.hasDefaultValue)
        .map((field) => field.name),
      ...(this.requiredFields || []),
    ]);
  }

  private get _prismaFieldDetailList() {
    // @ts-ignore reading a private property _dmmf :(
    return (this.prisma._dmmf.modelMap as Dictionary<Prisma.DMMF.Model>)[
      this.name!
    ].fields;
  }

  private get _prismaFieldDetailMap() {
    // @ts-ignore reading a private property _dmmf :(
    return Object.fromEntries(
      this._prismaFieldDetailList.map(({ ["name"]: prop, ...rest }) => [
        prop,
        { ...rest },
      ])
    );
  }

  // There are 2 types of validations:
  // 1, object level - validate()
  // 2, field level - validate_{field}()
  // Invoke all validators and return an error message.
  // @ts-ignore
  public validateAll(instance) {
    let errors = [];
    // Check required fields
    this._requiredFields.forEach((requiredField) => {
      if (!(requiredField in instance)) {
        errors.push({
          field: requiredField,
          message: "Missing required field.",
        });
      }
    });

    // Run object level validator
    try {
      this.validate && this.validate(instance);
    } catch (e: any) {
      if (e instanceof ValidationError) {
        errors.push({ field: undefined, message: e.message });
      } else {
        throw e;
      }
    }

    // Run field level validator
    const fieldValidators = Object.getOwnPropertyNames(this).filter(
      (property) => /^validate_/.test(property)
    );
    fieldValidators.forEach((validator) => {
      const field = validator.replace("validate_", "");
      try {
        // @ts-ignore How to fix ts?
        this[validator](instance[field], instance);
      } catch (e: any) {
        if (e instanceof ValidationError) {
          errors.push({ field, message: e.message });
        } else {
          throw e;
        }
      }
    });
    this._errors = errors;
    this._validated = true;
    return this.isValid;
  }

  public getField(name: string) {
    return this._prismaFieldDetailMap[name];
  }

  public deserialize(data: object) {
    // Remove unrecognized fields from input
    const filtered = this._allFields.reduce((prev, curr) => {
      if (curr in data) {
        // @ts-ignore
        return Object.assign(prev, { [curr]: data[curr] });
      }
      return prev;
    }, {});
    return filtered;
  }

  // This function filters the object keys by this.fields
  // @ts-ignore How to refer to the dynamically generated Prisma model instance type?
  public serialize(instance: any) {
    const filtered = this._fields.reduce((prev, curr) => {
      if (curr in instance) {
        return Object.assign(prev, { [curr]: instance[curr] });
      }
      return prev;
    }, {});

    return filtered;
  }

  public async list(options?: { skip?: number; take?: number }) {
    const { skip, take } = options || {};
    let q = new FindMany().select(this._fields);

    if (skip) {
      q = q.skip(skip < 0 ? 0 : skip);
    }

    if (take) {
      q = q.take(take);
    }

    // @ts-ignore
    const list = await this.prisma[this.key].findMany(q.query);
    const serialized = list.map((instance: object) => this.serialize(instance));
    return serialized;
  }

  public async create(data: any) {
    const deserialized = this.deserialize(data);
    // @ts-ignore
    const instance = await this.prisma[this.key].create({
      data: deserialized,
    });
    const serialized = this.serialize(instance);
    return serialized;
  }

  public async retrieve(id: string) {
    // TODO: handle record not found situation
    // @ts-ignore
    const instance = await this.prisma[this.key].findUnique({
      where: {
        // what about strings?
        // TODO: replace Number()
        [this.uniqueIdField]: this._formatId(id),
      },
    });
    const serialized = this.serialize(instance);
    return serialized;
  }

  public async update(id: string, data: any) {
    const deserialized = this.deserialize(data);

    // TODO: handle record not found situation, handle invalid update (e.g. unique fields)
    // @ts-ignore
    const instance = await this.prisma[this.key].update({
      where: {
        [this.uniqueIdField]: this._formatId(id),
      },
      data: deserialized,
    });
    const serialized = this.serialize(instance);
    return serialized;
  }

  public async destroy(id: string) {
    // TODO: handle record not found situation, handle invalid update (e.g. unique fields)
    // @ts-ignore
    const instance = await this.prisma[this.key].delete({
      where: {
        [this.uniqueIdField]: this._formatId(id),
      },
    });
    const serialized = this.serialize(instance);
    return serialized;
  }

  private _formatId(id: string) {
    const idType = this.getField(this.uniqueIdField).type as PrismaIDFieldTypes;

    if (idType === "Int") {
      return parseInt(id);
    }
    return id;
  }
}

export default Model;
