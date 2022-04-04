import { PrismaClient } from "@prisma/client";
// TODO: Use proper dependency injection method
let _prismaClient: PrismaClient | undefined;

const PrismaRestFrameworkClient = {
  init(client: PrismaClient) {
    if (!client) {
      throw new Error(
        "init() requires prisma client as the first argument, got 'undefined'"
      );
    }
    _prismaClient = client;
  },

  getPrismaClient(): PrismaClient | undefined {
    if (!_prismaClient) {
      console.warn(
        "Warning: Prisma Client is not defined, you must run init() first."
      );
    }
    return _prismaClient;
  },
};

// A decorator that injects the prisma client
function withPrisma<T extends { new (...args: any[]): {} }>(constructor: T) {
  return class extends constructor {
    get prisma() {
      return PrismaRestFrameworkClient.getPrismaClient();
    }
  };
}

class PrismaMixin {
  get prisma() {
    return PrismaRestFrameworkClient.getPrismaClient();
  }
}

// Typescript doesn't support decorator property types
// see https://www.typescriptlang.org/docs/handbook/decorators.html#class-decorators
// Thus we manually create this interface
export interface WithPrismaInterface {
  prisma: PrismaClient | undefined;
}

export default PrismaRestFrameworkClient;
export { withPrisma, PrismaMixin };
