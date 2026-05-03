import Database from "better-sqlite3";
import path from "node:path";

// In dev `npm run dev` cwd = web/. In Vercel build, rootDirectory = web/.
// The db file is inside web/db/ so it ships with the function bundle.
const DB_PATH =
  process.env.SQLITE_PATH ??
  path.join(process.cwd(), "db", "data.db");

declare global {
  var __db: Database.Database | undefined;
}

function open(): Database.Database {
  const db = new Database(DB_PATH, { readonly: true, fileMustExist: false });
  db.pragma("journal_mode = WAL");
  return db;
}

export function getDb(): Database.Database {
  if (!global.__db) global.__db = open();
  return global.__db;
}
