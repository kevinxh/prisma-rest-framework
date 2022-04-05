import { Prisma } from "@prisma/client";

class Query {
  type: Prisma.PrismaAction;
  query: { select?: object } = {};
  constructor(type: Prisma.PrismaAction) {
    this.type = type;
  }

  select(key: string | string[]) {
    if (typeof key === "string") {
      this.query = {
        ...this.query,
        select: { ...this.query.select, [key]: true },
      };
    } else {
      key.forEach((k) => {
        this.query = {
          ...this.query,
          select: { ...this.query.select, [k]: true },
        };
      });
    }

    return this;
  }
}

export type FindManyArgs = {
  select?: object;
  where?: object;
  orderBy?: object;
  cursor?: object;
  take?: number;
  skip?: number;
  distinct?: object;
};

class FindMany extends Query {
  query: FindManyArgs = {};

  constructor() {
    super("findMany");
  }

  take(number: number) {
    this.query = {
      ...this.query,
      take: number,
    };
    return this;
  }

  skip(number: number) {
    this.query = {
      ...this.query,
      skip: number,
    };
    return this;
  }
}

export { Query, FindMany };
