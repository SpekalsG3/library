import {MainCommand} from "./commands";
import {EKnexClients, StorageKnex} from "../../postgres";

async function cli() {
  const argv = process.argv;
  const commandName = ['cli'];

  let i = 2;
  let command = MainCommand;
  for (i; i < argv.length; i++) {
    const str = argv[i];
    if (str.startsWith("-")) {
      break;
    }

    command = command.subcommands[str];
    if (command === undefined) {
      throw new Error(`[${commandName.join(' ')}]: Unknown command "${str}"`)
    }
    commandName.push(str);
  }
  const name = commandName.join(' ');

  const db = new StorageKnex(EKnexClients.Postgres, {
    user: "postgres",
    password: "asdf",
    host: "127.0.0.1",
    port: 5432,
    dbName: "media_library",
  });

  let error: Error | null = null
  try {
    await command.handler(db, name, argv.slice(i))
  } catch (e) {
    error = new Error(`[${name}]: ${e}`);
  }

  await db.close();
  if (error) {
    throw error;
  }
}

cli()
  .then(() => console.log("\nMigration CLI successful!"))
  .catch((e) => console.log(`Migration CLI failed\n\n${e}`));
