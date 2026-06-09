declare module 'mongoose-unique-validator' {
  import { Schema } from 'mongoose';
  function uniqueValidator(schema: Schema, options?: Record<string, unknown>): void;
  export default uniqueValidator;
}
