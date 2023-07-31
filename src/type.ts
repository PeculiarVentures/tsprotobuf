import type { Type } from "protobufjs";
import { IConverter } from "./converter";
import type { ObjectProto } from "./object_proto";

/**
 * Represents a Protobuf serializable object. The object can import and export data
 * in Protobuf format.
 */
export interface IProtobufSerializable {
  /**
   * Imports data from a raw ArrayBuffer in Protobuf format.
   * @param raw - The ArrayBuffer containing the raw Protobuf data.
   */
  importProto(raw: ArrayBuffer): PromiseLike<void>;

  /**
   * Exports the current state of the object to a Protobuf formatted ArrayBuffer.
   * @returns A promise that resolves with the exported Protobuf data, or undefined if the object is empty.
   */
  exportProto(): PromiseLike<ArrayBuffer | undefined>;
}

/**
 * Represents the schema for a Protobuf object. The schema defines the structure and types of the object's data.
 */
export interface IProtobufScheme {
  /**
   * The local name of the schema.
   */
  localName?: string;

  /**
   * The items that make up the schema. The keys are the item names and the values are the item definitions.
   */
  items?: { [key: string]: IProtobufSchemeItem<any>; };

  /**
   * A reference to the target object that this schema represents.
   */
  target?: any;

  /**
   * The protobuf type associated with this schema.
   */
  protobuf?: Type;
}

/**
 * Represents the basic types supported by Protobuf.
 */
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

/**
 * Represents an item in a Protobuf schema.
 */
export interface IProtobufSchemeItem<T> {
  /**
   * The name of the item.
   */
  name: string;

  /**
   * The id of the item.
   */
  id: number;

  /**
   * Whether the item is required.
   */
  required: boolean;

  /**
   * Whether the item is repeated.
   */
  repeated: boolean;

  /**
   * The Protobuf type of the item.
   */
  type: ProtobufBasicTypes;

  /**
   * An optional converter for the item. The converter can be used to transform the item's data during serialization and deserialization.
   */
  converter?: IConverter<T>;

  /**
   * The default value for the item.
   */
  defaultValue?: T;

  /**
   * An optional parser for the item. The parser can be used to parse the item's data during deserialization.
   */
  parser?: typeof ObjectProto;
}

/**
 * Represents a Protobuf element.
 */
export interface IProtobufElement {
  /**
   * The name of the Protobuf schema element.
   */
  name?: string;
}

