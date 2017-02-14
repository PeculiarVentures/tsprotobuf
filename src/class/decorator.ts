import { Field, Type } from "protobufjs";
import {assign} from "pvtsutils";
import { IProtobufElement, IProtobufScheme, IProtobufSchemeItem } from "./type";

export function ProtobufElement(params: IProtobufElement) {
    return <TFunction extends Function>(target: TFunction) => {
        const t: IProtobufScheme = target as any;

        t.localName = params.name || (t as any).name;
        t.items = t.items || {};
        t.target = target;
        t.items = assign({}, t.items);

        // create protobuf scheme 
        const scheme = new Type(t.localName);
        for (const key in t.items) {
            const item = t.items[key];
            scheme.add(new Field(item.name, item.id, item.type, item.required ? void 0 : "optional"));
        }
        t.protobuf = scheme;
    };
}

function defineProperty(target: any, key: string, params: any) {
    const propertyKey = `_${key}`;

    const opt = {
        // tslint:disable-next-line:only-arrow-functions object-literal-shorthand
        set: function (v: any) {
            if (this[propertyKey] !== v) {
                this.raw = null;
                this[propertyKey] = v;
            }
        },
        // tslint:disable-next-line:only-arrow-functions object-literal-shorthand
        get: function () {
            if (this[propertyKey] === void 0) {
                let defaultValue = params.defaultValue;
                if (params.parser) {
                    defaultValue = new params.parser();
                }
                this[propertyKey] = defaultValue;
            }
            return this[propertyKey];
        },
    };

    // private property
    Object.defineProperty(target, propertyKey, { writable: true, enumerable: false });
    // public property
    Object.defineProperty(target, key, opt);
}

export function ProtobufProperty<T>(params: IProtobufSchemeItem<T>) {
    return (target: Object, propertyKey: string | symbol) => {
        const t: IProtobufScheme = target.constructor as any;
        const key = propertyKey as string;

        t.items = t.items || {};
        if (t.target !== t) {
            t.items = assign({}, t.items);
            t.target = t;
        }

        if (params.parser) {
            t.items[key] = {
                id: params.id,
                parser: params.parser,
                type: "bytes",
            };
        } else {
            t.items[key] = {
                id: params.id,
                type: params.type || "bytes",
                defaultValue: params.defaultValue,
                converter: params.converter,
            };
        }
        params.name = params.name || key;

        t.items[key].name = params.name;
        t.items[key].required = params.required || false;

        defineProperty(target, key, params);
    };

}
