import { Prisma } from "@prisma/client";
import { withPrisma, WithPrismaInterface } from "./client";
import { ValidationError } from "./errors";
import { IValidationError } from "./types";

interface Dictionary<T> {
  [key: string]: T;
}

interface Model extends WithPrismaInterface {}

@withPrisma
class Model {
  name: Prisma.ModelName | undefined;
  fields?: string[];
  requiredFields?: string[];
  validate?: (instace: any) => void;
  private _validated = false;
  private _errors: IValidationError[] = [];

  get key() {
    return this.name?.toLowerCase() as Lowercase<Prisma.ModelName>;
  }

  get isValid() {
    return this._validated && this._errors.length === 0;
  }

  get isValidated() {
    return this._validated;
  }

  get errors() {
    return this._errors;
  }

  private get _fields() {
    return this.fields || this._allFields;
  }

  private get _allFields() {
    return this._prismaFieldDetails.map((field) => field.name);
  }

  private get _requiredFields() {
    return new Set([
      ...this._prismaFieldDetails
        .filter((field) => field.isRequired && !field.hasDefaultValue)
        .map((field) => field.name),
      ...(this.requiredFields || []),
    ]);
  }

  private get _prismaFieldDetails() {
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

  deserialize(data: object) {
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
  serialize(instance: Dictionary) {
    const filtered = this._fields.reduce((prev, curr) => {
      if (curr in instance) {
        return Object.assign(prev, { [curr]: instance[curr] });
      }
      return prev;
    }, {});

    return filtered;
  }
}

export default Model;
