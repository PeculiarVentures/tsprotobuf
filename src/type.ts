import type { Type } from "protobufjs";
import { IConverter } from "./converter";
import type { ObjectProto } from "./object_proto";

export interface IProtobufSerializable {
    importProto(raw: ArrayBuffer): PromiseLike<void>;
    exportProto(): PromiseLike<ArrayBuffer | undefined>;
}

export interface IProtobufScheme {
    localName?: string;
    items?: { [key: string]: IProtobufSchemeItem<any> };
    target?: any;
    protobuf?: Type;
}

export interface IProtobufSchemeItem<T> {
    name?: string;
    id: number;
    required?: boolean;
    repeated?: boolean;
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
