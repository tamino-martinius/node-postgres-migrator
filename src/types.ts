export interface Dict<T> {
  [key: string]: T;
}

export interface Migration {
  version: string;
  up(sql: any): Promise<any>;
  down(sql: any): Promise<any>;
  parent?: string[];
}
