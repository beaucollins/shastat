/* eslint-disable */
// tslint:disable
// this file is generated by a tool; don't change it manually.

export type Foo_AllTypes = [
  {
    /** pg_type.typname: bpchar */
    id: unknown
    /** pg_type.typname: bpchar */
    sha: unknown
  }
]
export interface Foo_QueryTypeMap {
  [`SELECT * FROM foo WHERE id = $1`]: Foo_AllTypes[0]
}

export type Foo_UnionType = Foo_QueryTypeMap[keyof Foo_QueryTypeMap]

export type Foo = {
  [K in keyof Foo_UnionType]: Foo_UnionType[K]
}
export const Foo = {} as Foo

export const Foo_meta_v0 = [{"properties":[{"name":"id","value":"unknown","description":"pg_type.typname: bpchar"},{"name":"sha","value":"unknown","description":"pg_type.typname: bpchar"}],"description":"SELECT * FROM foo WHERE id = $1"}]
