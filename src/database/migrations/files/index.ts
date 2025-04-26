import init from "./0001-init-database";
import createdUpdatedAt from "./0002-add-created-updated-at";
import initMapTables from "./0003-init-map-tables";

export const MigrationsList = [
  init,
  createdUpdatedAt,
  initMapTables,
]
