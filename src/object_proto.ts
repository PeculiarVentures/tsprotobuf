import { IProtobufScheme, IProtobufSchemeItem, IProtobufSerializable } from "./type";

export class ObjectProto implements IProtobufSerializable {

  public static async importProto<T extends ObjectProto>(this: new () => T, data: ArrayBuffer | ObjectProto): Promise<T> {
    const res = new this();
    await res.importProto(data);

    return res;
  }

  protected raw?: ArrayBuffer | null;

  public isEmpty(): boolean {
    return this.raw === undefined;
  }

  public hasChanged(): boolean {
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

  public async importProto(data: ArrayBuffer | ObjectProto): Promise<void> {
    const thisStatic = this.constructor as IProtobufScheme;
    const that = this as any;
    let scheme: { [key: string]: any; };
    let raw: ArrayBuffer;
    if (data instanceof ObjectProto) {
      raw = await data.exportProto();
    } else {
      raw = data;
    }
    try {
      if (!thisStatic.protobuf) {
        throw new Error("Protobuf schema doesn't contain 'protobuf' property");
      }
      scheme = thisStatic.protobuf.decode(new Uint8Array(raw));
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Unknown error");
      throw new Error(`Error: Cannot decode message for ${thisStatic.localName}.\n$ProtobufError: ${err.message}`);
    }
    for (const key in thisStatic.items) {
      const item = thisStatic.items[key];
      if (!item.required && !scheme.hasOwnProperty(item.name)) {
        // Skip the property if field is optional and doesn't present in the scheme
        continue;
      }

      const schemeValue = scheme[item.name];

      if (item.repeated) {
        // initialize empty array for repeated scheme
        that[key] = [];

        if (!Array.isArray(schemeValue)) {
          throw new Error(`Cannot decode message for '${thisStatic.localName}'. Schema field '${item.name}' must be array`);
        }

        for (const value of schemeValue) {
          that[key].push(await this.importItem(item, value));
        }
      } else {
        that[key] = await this.importItem(item, schemeValue);
      }
    }
    this.raw = raw;
  }

  public async exportProto(): Promise<ArrayBuffer> {
    if (!this.hasChanged() && this.raw) {
      return this.raw;
    }

    const thisStatic = this.constructor as IProtobufScheme;
    const that = this as any;
    const protobuf: { [key: string]: any; } = {};

    for (const key in thisStatic.items) {
      const item = thisStatic.items[key];
      const value = that[key];

      if (item.repeated) {
        const list: any[] = protobuf[item.name] = [];
        for (const v of value) {
          const protobufValue = await this.exportItem(item, v);
          list.push(protobufValue);
        }
      } else {
        protobuf[item.name] = await this.exportItem(item, value);
      }
    }

    this.raw = new Uint8Array(thisStatic.protobuf!.encode(protobuf).finish()).buffer;

    return this.raw;
  }

  protected async exportItem(template: IProtobufSchemeItem<any>, value: unknown): Promise<any> {
    const thisStatic = this.constructor as IProtobufScheme;
    let result: any;
    if (template.parser) {
      // Parser
      if (template.required && !value) {
        throw new Error(`Parameter '${template.name}' is required in '${thisStatic.localName}' protobuf message.`);
      }
      if (value) {
        if (!(value instanceof template.parser)) {
          throw new Error(`Parameter '${template.name}' in '${thisStatic.localName}' is incorrect type. Must be '${template.parser.name}'.`);
        }
        const raw = await value.exportProto();
        result = new Uint8Array(raw);
      }
    } else {
      if (template.required && value === void 0) {
        throw new Error(`Error: Parameter '${template.name}' is required in '${thisStatic.localName}' protobuf message.`);
      }
      if (template.converter) {
        // Converter
        if (value !== undefined) {
          result = await template.converter.set(value);
        }
      } else {
        // Simple value
        if (value instanceof ArrayBuffer) {
          value = new Uint8Array(value);
        }
        result = value;
      }
    }

    return result;
  }

  protected async importItem(template: IProtobufSchemeItem<any>, value: any): Promise<any> {
    const thisStatic = this.constructor as IProtobufScheme;
    let result: any;
    if (template.parser) {
      // Parser
      const parser = template.parser;
      if (value && value.byteLength) {
        result = await parser.importProto(new Uint8Array(value).buffer);
      } else if (template.required) {
        throw new Error(`Error: Parameter '${template.name}' is required in '${thisStatic.localName}' protobuf message.`);
      }
    } else if (template.converter) {
      // Converter
      if (value && value.byteLength) {
        result = await template.converter.get(value);
      } else if (template.required) {
        throw new Error(`Error: Parameter '${template.name}' is required in '${thisStatic.localName}' protobuf message.`);
      }
    } else {
      // Simple value
      result = value;
    }

    return result;
  }

}
