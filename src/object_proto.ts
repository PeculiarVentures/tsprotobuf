import { IProtobufScheme, IProtobufSchemeItem, IProtobufSerializable } from "./type";

/**
 * Base class for protobuf objects.
 */
export class ObjectProto implements IProtobufSerializable {

  /**
   * Creates new instance of the class from ArrayBuffer or ObjectProto.
   * @param this - Class of the object to create.
   * @param data - Data to import.
   * @returns New instance of the class.
   */
  public static async importProto<T extends ObjectProto>(this: new () => T, data: ArrayBuffer | ObjectProto): Promise<T> {
    const res = new this();
    await res.importProto(data);

    return res;
  }

  /**
   * Raw data of the object. Represents protobuf message.
   */
  protected raw?: ArrayBuffer | null;

  /**
   * Returns `true` if object is empty. Otherwise `false`.
   * @returns `true` if object is empty, otherwise `false`.
   */
  public isEmpty(): boolean {
    return this.raw === undefined;
  }

  /**
   * Returns `true` if object has been changed. Otherwise `false`.
   * @returns `true` if object has been changed, otherwise `false`.
   */
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
      throw new Error(`Cannot decode message for ${thisStatic.localName}.\n$ProtobufError: ${err.message}`);
    }
    for (const key in thisStatic.items) {
      const item = thisStatic.items[key];

      let schemeValues = scheme[item.name];
      if (ArrayBuffer.isView(schemeValues)) {
        // Convert Buffer to Uint8Array
        schemeValues = new Uint8Array(schemeValues as Uint8Array);
      }
      // console.log(`Import:${thisStatic.localName}:${item.name}`);
      if (!Array.isArray(schemeValues)) {
        if (item.repeated) {
          // INFO: empty protobuf array returns undefined
          that[key] = schemeValues = [];
        } else {
          // Convert single element to array
          schemeValues = [schemeValues];
        }
      }
      if (item.repeated && !that[key]) {
        // initialize empty array for repeated scheme
        that[key] = [];
      }
      for (const schemeValue of schemeValues) {
        if (item.repeated) {
          that[key].push(await this.importItem(item, schemeValue));
        } else {
          that[key] = await this.importItem(item, schemeValue);
        }
      }
    }
    this.raw = raw;
  }

  public async exportProto(): Promise<ArrayBuffer> {
    if (!this.hasChanged()) {
      // NOTE: If check that raw is not `null` or `undefined`, it changes the behavior
      //       of the function and throws an error in dependent modules.
      return this.raw!;
    }

    const thisStatic = this.constructor as IProtobufScheme;
    const that = this as any;
    const protobuf: { [key: string]: any; } = {};

    for (const key in thisStatic.items) {
      const item = thisStatic.items[key];
      let values = that[key];

      if (!Array.isArray(values)) {
        values = values === void 0 ? [] : [values];
      }
      for (const value of values) {
        const protobufValue = await this.exportItem(item, value);
        if (item.repeated) {
          if (!protobuf[item.name]) {
            protobuf[item.name] = [];
          }
          protobuf[item.name].push(protobufValue);
        }
        else {
          protobuf[item.name] = protobufValue;
        }
      }
    }

    this.raw = new Uint8Array(thisStatic.protobuf!.encode(protobuf).finish()).buffer;

    return this.raw;
  }

  /**
   * Exports item to protobuf.
   * @param template - Template of the item.
   * @param value - Value of the item.
   * @returns Exported item.
   */
  protected async exportItem(template: IProtobufSchemeItem<any>, value: unknown): Promise<any> {
    const thisStatic = this.constructor as IProtobufScheme;
    let result: any;
    if (template.parser) {
      const obj = value as ObjectProto;
      const raw = await obj.exportProto();
      if (template.required && !raw) {
        throw new Error(`Parameter '${template.name}' is required in '${thisStatic.localName}' protobuf message.`);
      }
      if (raw) {
        result = new Uint8Array(raw);
      }
    }
    else {
      if (template.required && value === undefined) {
        throw new Error(`Parameter '${template.name}' is required in '${thisStatic.localName}' protobuf message.`);
      }
      if (template.converter) {
        if (value !== undefined) {
          result = await template.converter.set(value);
        }
      }
      else {
        if (value instanceof ArrayBuffer) {
          value = new Uint8Array(value);
        }
        result = value;
      }
    }

    return result;
  }

  /**
   * Imports item from protobuf.
   * @param template - Template of the item.
   * @param value - Value of the item.
   * @returns Imported item.
   */
  protected async importItem(template: IProtobufSchemeItem<any>, value: any): Promise<any> {
    const thisStatic = this.constructor as IProtobufScheme;
    let result: any;
    if (template.parser) {
      // Parser
      const parser = template.parser;
      if (value && value.byteLength) {
        result = await parser.importProto(new Uint8Array(value).buffer);
      } else if (template.required) {
        throw new Error(`Parameter '${template.name}' is required in '${thisStatic.localName}' protobuf message.`);
      }
    } else if (template.converter) {
      // Converter
      if (value && value.byteLength) {
        result = await template.converter.get(value);
      } else if (template.required) {
        throw new Error(`Parameter '${template.name}' is required in '${thisStatic.localName}' protobuf message.`);
      }
    } else {
      // Simple value
      result = value;
    }

    return result;
  }

}
