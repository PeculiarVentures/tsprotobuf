import { IProtobufScheme, IProtobufSerializable } from "./type";

export class ObjectProto implements IProtobufSerializable {

    public static async importProto<T extends ObjectProto>(this: { new (): T }, data: ArrayBuffer | ObjectProto) {
        const res = new this();
        await res.importProto(data);
        return res;
    }

    protected raw?: ArrayBuffer | null;

    public isEmpty() {
        return this.raw === undefined;
    }

    public hasChanged() {
        if (this.raw === null) {
            return true;
        }
        // check children
        const thisStatic = this.constructor as IProtobufScheme;
        const that = this as any;
        for (const key in thisStatic.items) {
            const item = thisStatic.items[key];
            if (item.repeated) {
                if (item.parser) {
                    return that[key].some((arrayItem: any) => arrayItem.hasChanged());
                }
            } else {
                if (item.parser && that[key] && that[key].hasChanged()) {
                    return true;
                }
            }
        }
        return false;
    }

    public async importProto(data: ArrayBuffer | ObjectProto) {
        const thisStatic = this.constructor as IProtobufScheme;
        const that = this as any;
        let scheme: { [key: string]: any };
        let raw: ArrayBuffer;
        if (data instanceof ObjectProto) {
            raw = await data.exportProto();
        } else {
            raw = data;
        }
        try {
            scheme = thisStatic.protobuf.decode(new Uint8Array(raw)).toObject();
        } catch (e) {
            throw new Error(`Error: Cannot decode message for ${thisStatic.localName}.\n$ProtobufError: {e.message}`);
        }
        for (const key in thisStatic.items) {
            const item = thisStatic.items[key];

            let schemeValues = scheme[item.name];
            if (ArrayBuffer.isView(schemeValues)) {
                // Convert Buffer to Uint8Array
                schemeValues = new Uint8Array(schemeValues as Uint8Array);
            }
            // console.log(`Import:${thisStatic.localName}:${item.name}`);

            let setValue: any;
            if (!Array.isArray(schemeValues)) {
                if (item.repeated) {
                    // INFO: empty protobuf array returns undefined
                    that[key] = schemeValues = [];
                } else {
                    // Convert single element to array
                    schemeValues = [schemeValues];
                }
            }
            for (const schemeValue of schemeValues) {
                if (item.parser) {
                    const parser = item.parser;
                    if (schemeValue && schemeValue.byteLength) {
                        setValue = await parser.importProto(new Uint8Array(schemeValue).buffer);
                    } else if (item.required) {
                        throw new Error(`Error: Parameter '${item.name}' is required in '${thisStatic.localName}' protobuf message.`);
                    }
                } else {
                    if (item.converter) {
                        if (schemeValue && schemeValue.byteLength) {
                            setValue = await item.converter.get(schemeValue);
                        } else if (item.required) {
                            throw new Error(`Error: Parameter '${item.name}' is required in '${thisStatic.localName}' protobuf message.`);
                        }
                    } else {
                        setValue = schemeValue;
                    }
                }
                if (item.repeated) {
                    if (!that[key]) {
                        that[key] = [];
                    }
                    that[key].push(setValue);
                } else {
                    that[key] = setValue;
                }
            }
        }
        this.raw = raw;
    }

    public async exportProto() {
        if (!this.hasChanged()) {
            return this.raw;
        }

        const thisStatic = this.constructor as IProtobufScheme;
        const that = this as any;
        const protobuf: { [key: string]: any } = {};
        for (const key in thisStatic.items) {
            const item = thisStatic.items[key];

            // console.log(`Export:${thisStatic.localName}:${item.name}`);
            let values = that[key];
            if (!Array.isArray(values)) {
                values = values === void 0 ? [] : [values];
            }

            for (let value of values) {
                let protobufValue: any;
                if (item.parser) {
                    const obj = value as ObjectProto;
                    const raw = await obj.exportProto();
                    if (item.required && !raw) {
                        throw new Error(`Error: Paramter '${key}' is required in '${thisStatic.localName}' protobuf message.`);
                    }
                    if (raw) {
                        protobufValue = new Uint8Array(raw);
                    }
                } else {
                    if (item.required && value === void 0) {
                        throw new Error(`Error: Paramter '${key}' is required in '${thisStatic.localName}' protobuf message.`);
                    }
                    if (item.converter) {
                        if (value) {
                            protobufValue = await item.converter.set(value);
                        }
                    } else {
                        if (value instanceof ArrayBuffer) {
                            value = new Uint8Array(value);
                        }
                        protobufValue = value;
                    }
                }
                if (item.repeated) {
                    if (!protobuf[item.name]) {
                        protobuf[item.name] = [];
                    }
                    protobuf[item.name].push(protobufValue);
                } else {
                    protobuf[item.name] = protobufValue;
                }
            }
        }
        this.raw = new Uint8Array(thisStatic.protobuf.encode(protobuf).finish()).buffer;
        return this.raw;
    }

}
