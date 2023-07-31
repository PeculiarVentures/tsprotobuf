# tsprotobuf

`tsprotobuf` is a helper library equipped with functions designed to facilitate the integration of ProtoBuf in TypeScript.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Coverage Status](https://coveralls.io/repos/github/PeculiarVentures/tsprotobuf/badge.svg?branch=master)](https://coveralls.io/github/PeculiarVentures/tsprotobuf?branch=master)
[![Node.js CI](https://github.com/PeculiarVentures/tsprotobuf/actions/workflows/test.yml/badge.svg)](https://github.com/PeculiarVentures/tsprotobuf/actions/workflows/test.yml)

## Installation

To install `tsprotobuf`, you can use npm as follows:

```shell
npm install tsprotobuf
```

## Usage

You can import and use `tsprotobuf` in your project as shown below:

In JavaScript:
```javascript
const tsprotobuf = require("tsprotobuf");
```

In TypeScript:
```javascript
import {ObjectProto, ProtobufElement, ProtobufProperty} from "tsprotobuf";
```

Example of a Protobuf schema:

```protobuf
message SearchRequest {
  required string query = 1;
  optional int32 page_number = 2;
  optional int32 result_per_page = 3;
}
```

![Screenshot](https://github.com/PeculiarVentures/tsprotobuf/blob/master/resources/screen.jpg?raw=true)

## Usage Examples

Here are some examples demonstrating how to use the `tsprotobuf` library to serialize and parse protobuf messages. The examples use the `async/await` syntax for handling promises.

### Serialization

```typescript
import { ProtobufElement, ProtobufProperty, ObjectProto } from "tsprotobuf";

@ProtobufElement({name: "SearchRequest"})
class SearchRequest extends ObjectProto {
    @ProtobufProperty({id: 1, name: "query", required: true, type: "string"})
    public query: string;
    @ProtobufProperty({id: 2, name: "page_number", type: "int32"})
    public pageNumber: number;
    @ProtobufProperty({id: 3, name: "result_per_page", type: "int32"})
    public resultPerPage: number;
}

// Use the class
const request = new SearchRequest();
request.query = "OpenAI";
request.pageNumber = 1;
request.resultPerPage = 10;

// Export the class instance into a protobuf message
async function serializeRequest() {
    try {
        const buffer = await request.exportProto();
        // `buffer` is an ArrayBuffer containing the serialized message
    } catch (error) {
        console.error("Failed to serialize message:", error);
    }
}

serializeRequest();
```

### Parsing

```typescript
import { ProtobufElement, ProtobufProperty, ObjectProto } from "tsprotobuf";

@ProtobufElement({name: "SearchRequest"})
class SearchRequest extends ObjectProto {
    @ProtobufProperty({id: 1, name: "query", required: true, type: "string"})
    public query: string;
    @ProtobufProperty({id: 2, name: "page_number", type: "int32"})
    public pageNumber: number;
    @ProtobufProperty({id: 3, name: "result_per_page", type: "int32"})
    public resultPerPage: number;
}

// Given a serialized message as an ArrayBuffer
const buffer: ArrayBuffer;

// Import the protobuf message into a class instance
async function parseRequest() {
    try {
        const request = await SearchRequest.importProto(buffer);
        // `request` is a `SearchRequest` object
        // Now you can access properties
        console.log(request.query);
        console.log(request.pageNumber);
        console.log(request.resultPerPage);
    } catch (error) {
        console.error("Failed to parse message:", error);
    }
}

parseRequest();
```

Please note that this example assumes that the `SearchRequest` message is simple. Parsing and serialization of nested messages or repeated fields might need additional logic or custom converters.

## Decorators

For more information on how to use decorators in TypeScript, you can check the official TypeScript [documentation on decorators](https://www.typescriptlang.org/docs/handbook/decorators.html).

### ProtobufElement

A decorator for `class`.

| Parameter | Type       | Description                                                                                  |
|-----------|------------|----------------------------------------------------------------------------------------------|
| name      | string     | Name of the scheme in the Protobuf model. Optional. If name is not specified, the name of the `class` is used. |

#### Example

```typescript
@ProtobufElement({name: "Person"})
class PersonProto {
    // class body here
}
```

### ProtobufProperty

A decorator for class properties.

| Parameter    | Type       | Description                                                                                |
|--------------|------------|--------------------------------------------------------------------------------------------|
| name         | string     | Name of the property in the Protobuf schema                                               |
| id           | number     | Index of the property in the Protobuf message                                             |
| required     | boolean    | Indicates whether the property is required                                                |
| repeated     | boolean    | Indicates whether the property is repeated                                                |
| type         | string     | Simple Protobuf type, e.g., `bytes`, `uint32`, `bool`, etc. The default value is `bytes`  |
| converter    | IConverter | Converter for complex data types                                                           |
| defaultValue | any        | Default value for the property                                                             |
| parser       | typeof ObjectProto | Parser class for nested Protobuf messages                                        |

#### Examples

The following examples demonstrate the usage of `ProtobufElement` and `ProtobufProperty` decorators.

1. Basic Protobuf message:

    Protobuf schema:

    ```protobuf
    message SearchRequest {
      required string query = 1;
      optional int32 page_number = 2;
      optional int32 result_per_page = 3;
    }
    ```

    TypeScript:

    ```typescript
    @ProtobufElement("SearchRequest")
    class SearchRequestProto extends ObjectProto {

        @ProtobufProperty({ name: "query", id: 1, type: "string", required: true })
        public query: string;

        @ProtobufProperty({ name: "page_number", id: 2, type: "uint32" })
        public pageNumber: number;

        @ProtobufProperty({ name: "result_per_page", id: 3, type: "uint32" })
        public resultPerPage: number;

    }
    ```

2. Using converters: Converts `Uint8Array` (`bytes`) to `ArrayBuffer`.

    Protobuf schema:

    ```protobuf
    message SecureRequest {
      optional int32 version  = 1;
      optional bytes key = 2;
    }
    ```

    TypeScript:

    ```typescript
    @ProtobufElement("SecureRequest")
    class SecureRequestProto extends ObjectProto {

        @ProtobufProperty({ name: "version", id: 1, type: "uint32" })
        public version: number;

        @ProtobufProperty({ name: "key", id: 2, type: "bytes", converter: ArrayBufferConverter })
        public key: ArrayBuffer;

    }
    ```

3. Nested types.

    Protobuf schema:

    ```protobuf
    message SearchResponse {
      message Result {
        required string url = 1;
        optional string title = 2;
      }
      optional Result result = 1;
    }
    ```

    TypeScript:

    ```typescript
    @ProtobufElement("Result")
    class ResultProto extends ObjectProto {

        @ProtobufProperty({ name: "url", id: 1, type: "string", required: true })
        public url: string;

        @ProtobufProperty({ name: "title", id: 2, type: "string" })
        public title: string;

    }

    @ProtobufElement("SearchResponse")
    class SearchResponseProto extends ObjectProto {

        @ProtobufProperty({ name: "result", id: 1, type: "bytes", parser: ResultProto })
        public result: ResultProto;

    }
    ```

4. Extending classes.

    ```typescript
    @ProtobufElement("BaseMessage")
    class BaseProto extends ObjectProto {

        @ProtobufProperty({ name: "version", id: 1, type: "uint32", defaultValue: 1 })
        public version: number;

    }

    @ProtobufElement("RequestMessage")
    class RequestMessageProto extends BaseProto {

        @ProtobufProperty({ name: "text", id: 2, type: "string" })
        public text: string;

    }
    ```

5. Repeating fields.

    Protobuf schema:

    ```protobuf
    message CryptoKey {
      required string algorithm = 1;
      required string type = 2;
      required bool extractable = 3;
      repeated string usages = 4;
    }

    message CryptoKeys {
        repeated CryptoKey keys = 1;
    }
    ```

    TypeScript:

    ```typescript
    @ProtobufElement("CryptoKey")
    class CryptoKeysProto extends ObjectProto {

        static INDEX = 0;

        @ProtobufProperty({ id: CryptoKeyProto.INDEX++, type: "string", required: true })
        public algorithm: string;

        @ProtobufProperty({ id: CryptoKeyProto.INDEX++, type: "string", required: true })
        public type: string;

        @ProtobufProperty({ id: CryptoKeyProto.INDEX++, type: "bool", required: true })
        public extractable: boolean;

        @ProtobufProperty({ id: CryptoKeyProto.INDEX++, type: "string", repeated: true

## License

MIT

## Support

Please file an issue on the GitHub page for this project if you experience any problems or have suggestions for improvements.

## Contributions

We welcome all contributions. Please submit a pull request on the GitHub page for this project.
