import {CliCommand, CliOptions} from "../types";
import {IStorageAdapter} from "../../../types";

export const InitCommand: CliCommand = {
  description: "Initialize database",
  subcommands: {},

  getOptionsHelp(): CliOptions {
    return {};
  },

  async handler(db: IStorageAdapter, name: string, argv: string[]): Promise<void> {
    const unknownOptions = [];
    for (let i = 0; i < argv.length; i++) {
      if (argv[i].startsWith('-')) {
        unknownOptions.push(argv)
      }
    }
    if (unknownOptions.length > 0) {
      throw new Error(`Unknown options: ${unknownOptions.join(', ')}`)
    }

    await db.migrationsInit();
    console.log(`[${name}] Initialized migration tables`);
  }
}
