import 'dotenv/config'

import * as process from "node:process";

import {MainCommand} from "./commands";
import {tryConnOpts} from "../../utils";

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

  if (!process.env.CLI_DB_OPTIONS) {
    throw new Error("Env 'CLI_DB_OPTIONS' is not provided");
  }

  const opts = JSON.parse(process.env.CLI_DB_OPTIONS);
  const db = tryConnOpts(opts);

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
