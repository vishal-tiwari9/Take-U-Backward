declare module "node-latex" {
  import { Readable } from "stream";
  function latex(src: string, options?: { cmd?: string; passes?: number }): Readable;
  export default latex;
}