import { Convert } from "pvtsutils";

/**
 * Converter interface.
 */
export interface IConverter<In> {
  /**
   * Converts value to Uint8Array.
   * @param value - Value to convert.
   * @returns Byte array representation of the value.
   */
  set: (value: In) => Promise<Uint8Array>;
  /**
   * Converts value from Uint8Array.
   * @param value - Byte array to convert.
   * @returns Converted value.
   */
  get: (value: Uint8Array) => Promise<In>;
}

/**
 * ArrayBuffer converter.
 */
export class ArrayBufferConverter {
  public static async set(value: ArrayBuffer): Promise<Uint8Array> {
    return new Uint8Array(value);
  }
  public static async get(value: Uint8Array): Promise<ArrayBufferLike> {
    return new Uint8Array(value).buffer;
  }
}

/**
 * String converter.
 */
export class StringConverter {
  public static async set(value: string): Promise<Uint8Array> {
    return new Uint8Array(Convert.FromUtf8String(value));
  }
  public static async get(value: Uint8Array): Promise<string> {
    return Convert.ToUtf8String(value);
  }
}
