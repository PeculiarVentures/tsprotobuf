import type { Type } from "protobufjs";
import { IConverter } from "./converter";
import type { ObjectProto } from "./object_proto";

export interface IProtobufSerializable {
  importProto(raw: ArrayBuffer): PromiseLike<void>;
  exportProto(): PromiseLike<ArrayBuffer | undefined>;
}

export interface IProtobufScheme {
  localName?: string;
  items?: { [key: string]: IProtobufSchemeItem<any>; };
  target?: any;
  protobuf?: Type;
}

export type ProtobufBasicTypes =
  "double" |
  "float" |
  "int32" |
  "uint32" |
  "sint32" |
  "fixed32" |
  "sfixed32" |
  "int64" |
  "uint64" |
  "sint64" |
  "fixed64" |
  "sfixed64" |
  "bool" |
  "string" |
  "bytes";

export interface IProtobufSchemeItem<T> {
  name: string;
  id: number;
  required: boolean;
  repeated: boolean;
  type: ProtobufBasicTypes;
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
