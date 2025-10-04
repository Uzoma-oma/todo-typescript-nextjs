import Dexie from "dexie";

export const db = new Dexie("todoDB");
db.version(1).stores({
  todos: "++id, todo, completed, userId"
});

