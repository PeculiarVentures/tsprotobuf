import {Convert} from "pvtsutils";

export interface IConverter<In> {
    set: (value: In) => PromiseLike<Uint8Array>;
    get: (value: Uint8Array) => PromiseLike<In>;
}

export class ArrayBufferConverter {
    public static async set(value: ArrayBuffer) {
        return new Uint8Array(value);
    }
    public static async get(value: Uint8Array) {
        return value.buffer;
    };
}

export class StringConverter {
    public static async set(value: string) {
        return new Uint8Array(Convert.FromUtf8String(value));
    };
    public static async get(value: Uint8Array) {
        return Convert.ToUtf8String(value);
    }
}
