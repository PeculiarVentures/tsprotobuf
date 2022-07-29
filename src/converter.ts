import { Convert } from "pvtsutils";

export interface IConverter<In> {
  set: (value: In) => Promise<Uint8Array>;
  get: (value: Uint8Array) => Promise<In>;
}

export class ArrayBufferConverter {
  public static async set(value: ArrayBuffer): Promise<Uint8Array> {
    return new Uint8Array(value);
  }
  public static async get(value: Uint8Array): Promise<ArrayBufferLike> {
    return new Uint8Array(value).buffer;
  }
}

export class StringConverter {
  public static async set(value: string): Promise<Uint8Array> {
    return new Uint8Array(Convert.FromUtf8String(value));
  }
  public static async get(value: Uint8Array): Promise<string> {
    return Convert.ToUtf8String(value);
  }
}
