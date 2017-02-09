import { IProtobufScheme, IProtobufSerializable } from "./type";

export class ObjectProto implements IProtobufSerializable {

    public static async importProto<T extends ObjectProto>(this: { new (): T }, raw: ArrayBuffer) {
        const res = new this();
        await res.importProto(raw);
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
            if (item.parser && that[key] && that[key].hasChanged()) {
                return true;
            }
        }
        return false;
    }

    public async importProto(raw: ArrayBuffer) {
        const thisStatic = this.constructor as IProtobufScheme;
        const that = this as any;
        let scheme: { [key: string]: any };
        try {
            scheme = thisStatic.protobuf.decode(new Uint8Array(raw)).toObject();
        } catch (e) {
            throw new Error(`Error: Cannot decode message for ${thisStatic.localName}.\n$ProtobufError: {e.message}`);
        }
        for (const key in thisStatic.items) {
            const item = thisStatic.items[key];

            const schemeValue = scheme[item.name];
            if (ArrayBuffer.isView(schemeValue)) {
                scheme[item.name] = new Uint8Array(schemeValue as Uint8Array);
            }
            // console.log(`Import:${thisStatic.localName}:${item.name}`);
            if (item.parser) {
                const parser = item.parser;
                if (scheme[item.name] && scheme[item.name].byteLength) {
                    that[key] = await parser.importProto(new Uint8Array(scheme[item.name]).buffer);
                } else if (item.required) {
                    throw new Error(`Error: Parameter '${item.name}' is required in '${thisStatic.localName}' protobuf message.`);
                }
            } else {
                if (item.converter) {
                    if (scheme[item.name] && scheme[item.name].byteLength) {
                        that[key] = await item.converter.get(scheme[item.name]);
                    } else if (item.required) {
                        throw new Error(`Error: Parameter '${item.name}' is required in '${thisStatic.localName}' protobuf message.`);
                    }
                } else {
                    that[key] = scheme[item.name];
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
            if (item.parser) {
                const obj = that[key] as ObjectProto;
                const raw = await obj.exportProto();
                if (item.required && !raw) {
                    throw new Error(`Error: Paramter '${key}' is required in '${thisStatic.localName}' protobuf message.`);
                }
                if (raw) {
                    protobuf[item.name] = new Uint8Array(raw);
                }
            } else {
                if (item.required && that[key] === void 0) {
                    throw new Error(`Error: Paramter '${key}' is required in '${thisStatic.localName}' protobuf message.`);
                }
                if (item.converter) {
                    if (that[key]) {
                        protobuf[item.name] = await item.converter.set(that[key]);
                    }
                } else {
                    let value = that[key];
                    if (value instanceof ArrayBuffer) {
                        value = new Uint8Array(value);
                    }
                    protobuf[item.name] = value;
                }
            }
        }
        this.raw = new Uint8Array(thisStatic.protobuf.encode(protobuf).finish()).buffer;
        return this.raw;
    }

}
