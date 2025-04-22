export enum EDBFieldTypes {
  String = "String",
  Integer = "Integer",
  Date = "Date",
  JSON = "JSON",
}

type _DBFieldToTs<T extends EDBFieldTypes> = {
  [EDBFieldTypes.String]: string,
  [EDBFieldTypes.Integer]: number,
  [EDBFieldTypes.Date]: Date,
  [EDBFieldTypes.JSON]: any,
}[T];

type DBFieldToTs<
  T extends EDBFieldTypes,
  IsNullable extends boolean,
  SerdeValue extends unknown,
> =
  unknown extends SerdeValue
    ? true extends IsNullable
      ? _DBFieldToTs<T> | null
      : _DBFieldToTs<T>
    : true extends IsNullable
      ? SerdeValue | null
      : SerdeValue;

export interface IDBField<T> {
  dbType: EDBFieldTypes,
  isNullable: boolean,
  isPrimaryKey?: true,
  variants?: string[],
  deserializeWith?: (value: unknown) => T,
  serializeWith?: (value: T) => unknown,
}

type TDBEntity<Fields extends Record<string, string>> = {
  [F in Fields[keyof Fields]]: IDBField<any>
}

type DBToTs<Fs extends Record<string, string>, T extends TDBEntity<Fs>> = {
  [F in Fs[keyof Fs]]: DBFieldToTs<
    T[F]['dbType'],
    T[F]['isNullable'],
    T[F]['deserializeWith'] extends (value: any) => infer SerdeValue
      ? SerdeValue
      : T[F]['serializeWith'] extends (value: infer SerdeValue) => any
        ? SerdeValue
        : unknown
  >
}

export class DBEntityManager<
  Fields extends Record<string, string>,
  DB extends TDBEntity<Fields>,
  TS extends DBToTs<Fields, DB>,
> {
  // @ts-ignore
  private getEntity(): TS;

  public constructor (
    public readonly tableName: string,
    public readonly fields: Fields,
    public readonly entity: DB,
  ) {
    let primaryKey: string | null = null;
    for (const fieldName in entity) {
      if (entity[fieldName].isPrimaryKey) {
        if (primaryKey) {
          throw new Error(`Can have only one primary key - but ${tableName} has ${primaryKey} and ${fieldName}`)
        }
        if (entity[fieldName].isNullable) {
          throw new Error(`Primary key cannot be nullable - but ${tableName} set ${fieldName} as nullable`);
        }
        primaryKey = fieldName;
      }
    }
    if (!primaryKey) {
      throw new Error(`Table has to have at least one primary key - but ${tableName} has none`);
    }
  }

  public fromDb (
    object: Record<string, any>,
  ): TS {
    const res: any = {};

    for (const fieldRef in this.fields) {
      const fieldName = this.fields[fieldRef];

      let value = object[fieldName] ?? null;

      res[fieldName] = value;
    }

    return res;
  }

  public toDb (
    object: Record<string, any>,
  ): object {
    const res: Record<string, any> = {};

    for (const fieldRef in this.fields) {
      const fieldName = this.fields[fieldRef];

      let value = object[fieldName];
      delete object[fieldName];
      if (value === undefined) {
        continue;
      }

      const isNull = value === null;
      if (!this.entity[fieldName].isNullable && isNull) {
        throw new Error(`Field '${fieldName}' is not nullable`)
      }

      if (!isNull) {
        const f = this.entity[fieldName].serializeWith as any;
        if (f) {
          value = f(value);
        }
      }

      res[fieldName] = value;
    }

    const leftKeys = Object.keys(object);
    if (leftKeys.length > 0) {
      throw new Error(`Unknown ${this.tableName} fields provided: '${leftKeys.join("','")}'`)
    }
    return res;
  }
}
