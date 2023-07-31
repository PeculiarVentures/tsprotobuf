import { Field, Type } from "protobufjs";
import { assign } from "pvtsutils";
import { IConverter } from "./converter";
import type { ObjectProto } from "./object_proto";
import { IProtobufElement, IProtobufScheme, IProtobufSchemeItem, ProtobufBasicTypes } from "./type";

export interface ProtobufPropertyParams<T = unknown> {
  name?: string;
  id: number;
  required?: boolean;
  repeated?: boolean;
  type?: ProtobufBasicTypes;
  converter?: IConverter<T>;
  defaultValue?: T;
  parser?: typeof ObjectProto;
}

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
