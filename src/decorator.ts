import { Field, Type } from "protobufjs";
import { assign } from "pvtsutils";
import { IConverter } from "./converter";
import type { ObjectProto } from "./object_proto";
import { IProtobufElement, IProtobufScheme, IProtobufSchemeItem, ProtobufBasicTypes } from "./type";

export interface ProtobufPropertyParams<T = unknown> {
  /**
   * Property name in protobuf message. If not specified, property name will be used.
   */
  name?: string;
  /**
   * Property id in protobuf message.
   */
  id: number;
  /**
   * Defines if property is required.
   */
  required?: boolean;
  /**
   * Defines if property is repeated.
   */
  repeated?: boolean;
  /**
   * Defines property type.
   */
  type?: ProtobufBasicTypes;
  /**
   * Defines property converter. If not specified, default converter will be used.
   */
  converter?: IConverter<T>;
  /**
   * Defines default value for property.
   */
  defaultValue?: T;
  /**
   * Defines property parser.
   */
  parser?: typeof ObjectProto;
}

/**
 * Decorator for protobuf class.
 * @param params - Decorator parameters.
 * @returns Class decorator.
 */
export function ProtobufElement(params: IProtobufElement): ClassDecorator {
  // tslint:disable-next-line: ban-types
  return <TFunction extends Function>(target: TFunction) => {
    const t: IProtobufScheme = target as any;

    t.localName = params.name || (t as any).name || t.toString().match(/^function\s*([^\s(]+)/)![1];
    t.items = t.items || {};
    t.target = target;
    t.items = assign({}, t.items);

    // create protobuf scheme
    const scheme = new Type(t.localName!);
    for (const key in t.items) {
      const item = t.items[key];
      let rule: string | undefined = void 0;
      if (item.repeated) {
        rule = "repeated";
      } else if (item.required) {
        rule = "required";
      }
      scheme.add(new Field(item.name!, item.id, item.type, rule));
    }
    t.protobuf = scheme;
  };
}

function defineProperty(target: any, key: string, params: IProtobufSchemeItem<any>): void {
  const propertyKey = `_${key}`;

  const opt = {
    // tslint:disable-next-line:only-arrow-functions object-literal-shorthand
    set: function (this: any, v: any): void {
      if (this[propertyKey] !== v) {
        this.raw = null;
        this[propertyKey] = v;
      }
    },
    // tslint:disable-next-line:only-arrow-functions object-literal-shorthand
    get: function (this: any): any {
      if (this[propertyKey] === void 0) {
        let defaultValue = params.defaultValue;
        if (params.parser && !params.repeated) {
          defaultValue = new params.parser();
        }
        this[propertyKey] = defaultValue;
      }

      return this[propertyKey];
    },
    enumerable: true,
  };

  // private property
  Object.defineProperty(target, propertyKey, { writable: true, enumerable: false });
  // public property
  Object.defineProperty(target, key, opt);
}

/**
 * Decorator for protobuf property
 * @param params - Property parameters.
 * @returns Property decorator.
 */
export function ProtobufProperty<T>(params: ProtobufPropertyParams<T>): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    const t = target.constructor as IProtobufScheme;
    const key = propertyKey as string;
    t.items = t.items || {};
    if (t.target !== t) {
      t.items = assign({}, t.items);
      t.target = t;
    }
    t.items![key] = {
      id: params.id,
      type: params.type || "bytes",
      defaultValue: params.defaultValue,
      converter: params.converter || null as any,
      parser: params.parser || null as any,
      name: params.name || key as any,
      required: params.required || false,
      repeated: params.repeated || false,
    };
    defineProperty(target, key, t.items![key]);
  };

}
