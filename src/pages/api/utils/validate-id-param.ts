import {runChecks} from "@api/utils/run-checks";

export function validateIdParam (param: string | string[] | undefined): number {
  const id = Number(param);
  runChecks([
    [!isNaN(id), "/[id] should be a single parameter"],
  ]);
  return id
}
