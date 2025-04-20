import {CliCommand, CliOptions} from "../types";
import {InitCommand} from "./init";
import {RunCommand} from "./run";
import {RollbackCommand} from "./rollback";

export const MainCommand: CliCommand = {
  description: "Manages database migrations",
  subcommands: {
    init: InitCommand,
    run: RunCommand,
    rollback: RollbackCommand,
  },

  async handler(name: string, argv: string[]): Promise<void> {
    throw new Error("Use help to get list of available commands");
  },

  getOptionsHelp(): CliOptions {
    return {}
  }
}
