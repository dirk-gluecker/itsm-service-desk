// Type declarations for modules without proper type definitions
declare module 'bcryptjs' {
  function hash(s: string, salt: number | string): Promise<string>;
  function hashSync(s: string, salt: number | string): string;
  function compare(s: string, hash: string): Promise<boolean>;
  function compareSync(s: string, hash: string): boolean;
  function genSalt(rounds?: number): Promise<string>;
  function genSaltSync(rounds?: number): string;
  function getRounds(hash: string): number;
  
  export { hash, hashSync, compare, compareSync, genSalt, genSaltSync, getRounds };
  export default { hash, hashSync, compare, compareSync, genSalt, genSaltSync, getRounds };
}
