# development project

To prototype the library quickly, this is a sample development project for testing the interface from the user land.

This is a quick dirty way to develop the library, in the future, this should be replaced by a monorepo setup.

### Get started

Pre-requisite: Node.js and a running Postgres database.

```
npm install
```

create a .env file that includes the database url:

```
DATABASE_URL="postgresql://user:password@localhost:5432/db?schema=public"
```

If you'd like to use docker to run the database, here is a quick command:

```
npm run db:start
```

Prepare the database and prisma client:

```
npm run generate
npm run db:migrate
```

Start the sample dev project:

```
npm start
```
