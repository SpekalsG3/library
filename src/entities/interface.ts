import {escapeSqlString, unescapeSqlString} from "../utils/database/escapes";

export enum EDBFieldTypes {
  String = 'String',
  Integer = 'Integer',
  Date = 'Date',
}

type _DBFieldToTs<T extends EDBFieldTypes> = {
  [EDBFieldTypes.String]: string,
  [EDBFieldTypes.Integer]: number,
  [EDBFieldTypes.Date]: Date,
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

export interface IDBField<T extends EDBFieldTypes> {
  dbType: T,
  isNullable: boolean,
  isPrimaryKey?: true,
  variants?: string[],
  deserializeWith?: (value: _DBFieldToTs<T>) => unknown,
  serializeWith?: (value: unknown) => _DBFieldToTs<T>,
}

type TDBEntity = {
  [name: string]: IDBField<EDBFieldTypes.String>
    | IDBField<EDBFieldTypes.Integer>
    | IDBField<EDBFieldTypes.Date>,
}

type DBToTs<T extends TDBEntity> = {
  [key in keyof T]: DBFieldToTs<
    T[key]['dbType'],
    T[key]['isNullable'],
    T[key]['deserializeWith'] extends (value: any) => infer SerdeValue
      ? SerdeValue
      : T[key]['serializeWith'] extends (value: infer SerdeValue) => any
        ? SerdeValue
        : unknown
  >
}

type WhereClause<E extends TDBEntity, TE extends DBToTs<E>> = {
  [key in keyof TE]?: TE[key]
}

export class DBEntity<
  DB extends TDBEntity,
  TS extends DBToTs<DB>,
> {
  public constructor(
    private readonly manager: DBEntityManager<DB, TS>,
    public current: TS
  ) {
    // todo optimization: copy `current` to `old` and use to determine changes on save, if any
  }

  public async save (): Promise<void> {
    const db = await getDB();

    const updates = Object.entries(this.current)
      .reduce<string[]>((acc, [field, value]) => {
        if (field === this.manager.primaryKey) {
          return acc;
        }

        acc.push(`${field} = ${this.manager.toDb(field, value)}`);
        return acc;
      }, []);
    if (updates.length === 0) {
      return;
    }

    const primaryKey = this.manager.primaryKey as string;
    const primaryKeyValue = this.current[this.manager.primaryKey];
    const query = `UPDATE ${this.manager.tableName} SET`
      + `${updates.join(',')}`
      + `WHERE ${primaryKey} = ${primaryKeyValue}`

    const stmt = await db.run(query);
    if (stmt.changes! === 0) {
      throw new Error(`Invalid primary key for entity - from ${this.manager.tableName} with ${primaryKey} = ${primaryKeyValue}`);
    }
  }
}

export class DBEntityManager<
  DB extends TDBEntity,
  TS extends DBToTs<DB>,
> {
  public readonly primaryKey: keyof TS;

  public constructor (
    public readonly tableName: string,
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
    this.primaryKey = primaryKey;
  }

  getEntity (c: TS): DBEntity<DB, TS> {
    return new DBEntity(this, c);
  }

  public fromDb (
    field: string,
    value: any,
  ): any {
    if (value !== null) {
      switch (this.entity[field].dbType) {
        case EDBFieldTypes.String: {
          value = unescapeSqlString(value as string)
          break;
        }
        case EDBFieldTypes.Integer: {
          // value = value
          break;
        }
        case EDBFieldTypes.Date: {
          value = new Date(value);
          break;
        }
      }

      const f = this.entity[field].deserializeWith;
      if (f) {
        // @ts-ignore
        value = f(value);
      }
    }

    return value;
  }
  public toDb (
    field: string,
    value: any,
  ): any {
    const isNull = [null, undefined].includes(value);
    if (!this.entity[field].isNullable && isNull) {
      throw new Error(`Field '${field}' is not nullable`)
    }

    if (!isNull) {
      const f = this.entity[field].serializeWith;
      if (f) {
        value = f(value);
      }

      switch (this.entity[field].dbType) {
        case EDBFieldTypes.String: {
          value = escapeSqlString(value as string);
          break;
        }
        case EDBFieldTypes.Integer: {
          value = String(value);
          break;
        }
        case EDBFieldTypes.Date: {
          value = String(value.getTime())
          break;
        }
      }
    } else {
      value = 'NULL';
    }

    return value;
  }

  private where (where?: WhereClause<DB, TS>): string {
    if (!where) {
      return '';
    }
    return `WHERE ${
      Object.entries(where)
        .map(([field, value]) => {
          return `${field} = ${this.toDb(field, value)}`
        })
        .join(' and ')
    }`;
  }

  public async getAll (props: {
    where?: WhereClause<DB, TS>,
    limit?: number,
  }): Promise<DBEntity<DB, TS>[]> {
    const db = await getDB();

    const fields = Object.keys(this.entity);
    const query = `SELECT ${fields.join(',')}`
      + ` FROM ${this.tableName}`
      + ` ${this.where(props.where)}`
      + ` ${props.limit ? `LIMIT ${props.limit}` : ""}`;
    const data = await db.all<any[]>(query);

    return data
      .map((d) => {
        const ts = Object
          .entries(d)
          .reduce<any>((acc, [field, value]) => {
            acc[field] = this.fromDb(field, value);
            return acc;
          }, {});
        return new DBEntity(
          this,
          ts,
        );
      });
  }

  public async insert (
    data: Partial<TS>,
  ): Promise<DBEntity<DB, TS>> {
    const results = await this.insertBulk([data]);
    return results[0];
  }

  public async insertBulk(
    bulk: Partial<TS>[],
  ): Promise<DBEntity<DB, TS>[]> {
    const db = await getDB();

    const tss: TS[] = [];

    const fields = Object.keys(this.entity)
      .filter(f => f !== this.primaryKey);

    const values = bulk
      .reduce<string[][]>((acc, data) => {
        const values: string[] = [];
        tss.push({} as any);

        for (const field of fields) {
          if (!this.entity[field].isNullable && ([undefined, null].includes(data[field] as any))) {
            throw new Error(`Field ${field} is not nullable`);
          }
          const value = data[field] ?? null;

          // @ts-ignore
          tss.at(-1)[field] = value;

          values.push(this.toDb(field, value));
        }

        acc.push(values);
        return acc;
      }, []);

    const query = `INSERT INTO`
      + ` ${this.tableName}(${fields.join(',')})`
      + ` VALUES (${values.map(v => v.join(',')).join('),(')})`
      + ` RETURNING ${this.primaryKey as string}`;
    const results = await db.all(query);

    return results
      .map((result, i) => {
        tss[i][this.primaryKey] = result[this.primaryKey];
        return new DBEntity(this, tss[i]);
      });
  }

  public async update (props: {
    data: Partial<TS>,
    where: WhereClause<DB, TS>,
  }): Promise<number> {
    const db = await getDB();

    const updates = Object.entries(props.data)
      .reduce<string[]>((acc, [field, value]) => {
        if (
          !this.entity[field] // in case passed extra data
          || field === this.primaryKey // this key identifies entity
        ) {
          return acc;
        }

        acc.push(`${field} = ${this.toDb(field, value)}`);
        return acc;
      }, []);
    if (updates.length === 0) {
      return 0;
    }

    const query = `UPDATE ${this.tableName} SET`
      + ` ${updates.join(',')}`
      + ` ${this.where(props.where)}`;

    const stmt = await db.run(query);
    return stmt.changes ?? 0;
  }

  public async delete (props: {
    where: WhereClause<DB, TS>,
  }): Promise<number> {
    const db = await getDB();

    const query = `DELETE FROM ${this.tableName}`
      + ` ${this.where(props.where)}`;

    const stmt = await db.run(query);
    return stmt.changes ?? 0;
  }
}
