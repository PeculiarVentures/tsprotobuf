/// <reference types="protobufjs" />

declare namespace tsprotobuf {

    export interface IProtobufSerializable {
        importProto(raw: ArrayBuffer): PromiseLike<void>;
        exportProto(): PromiseLike<ArrayBuffer | undefined>;
    }
    export interface IProtobufScheme {
        localName?: string;
        items?: {
            [key: string]: IProtobufSchemeItem<any>;
        };
        target?: any;
        protobuf?: protobuf.Type;
    }
    export interface IProtobufSchemeItem<T> {
        name?: string;
        id: number;
        required?: boolean;
        type?: string;
        converter?: IConverter<T>;
        defaultValue?: T;
        parser?: typeof ObjectProto;
    }
    export interface IProtobufElement {
        /**
         * Name of protobuf schema element
         */
        name?: string;
    }

    export interface IConverter<In> {
        set: (value: In) => PromiseLike<Uint8Array>;
        get: (value: Uint8Array) => PromiseLike<In>;
    }
    export class ArrayBufferConverter {
        static set(value: ArrayBuffer): Promise<Uint8Array>;
        static get(value: Uint8Array): Promise<ArrayBuffer>;
    }
    export class StringConverter {
        static set(value: string): Promise<Uint8Array>;
        static get(value: Uint8Array): Promise<string>;
    }

    export function ProtobufElement(params: IProtobufElement): <TFunction extends Function>(target: TFunction) => void;
    export function ProtobufProperty<T>(params: IProtobufSchemeItem<T>): (target: Object, propertyKey: string | symbol) => void;

    export class ObjectProto implements IProtobufSerializable {
        static importProto<T extends ObjectProto>(this: {
            new (): T;
        }, raw: ArrayBuffer): Promise<T>;
        protected raw?: ArrayBuffer | null;
        isEmpty(): boolean;
        hasChanged(): boolean;
        importProto(raw: ArrayBuffer): Promise<void>;
        exportProto(): Promise<ArrayBuffer>;
    }

}

export = tsprotobuf;
export as namespace tsprotobuf;
