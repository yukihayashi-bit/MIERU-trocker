import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";
import { initDatabase } from "../db/schema";

const DB_NAME = "mieru.db";

const DatabaseContext = createContext<SQLiteDatabase | null>(null);

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<SQLiteDatabase | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const database = await openDatabaseAsync(DB_NAME);
      await initDatabase(database);
      if (mounted) setDb(database);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // DB が初期化されるまで children をレンダーしない
  if (!db) return null;

  return (
    <DatabaseContext.Provider value={db}>{children}</DatabaseContext.Provider>
  );
}

export function useDatabase(): SQLiteDatabase {
  const db = useContext(DatabaseContext);
  if (!db) throw new Error("useDatabase must be used within DatabaseProvider");
  return db;
}
