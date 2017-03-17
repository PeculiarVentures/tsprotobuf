import { assert } from "chai";
import * as util from "pvtsutils";
import { ObjectProto, ProtobufElement, ProtobufProperty } from "../";
import { ArrayBufferConverter, StringConverter } from "../";

context("proto", () => {

    context("simple types", () => {

        it("string", (done) => {
            async function Test() {

                @ProtobufElement({ name: "test" })
                class TestProto extends ObjectProto {
                    @ProtobufProperty({ name: "data", type: "string", id: 1 })
                    public data: string;
                }

                const test1 = new TestProto();
                test1.data = "hello";

                const raw = await test1.exportProto();

                const test2 = await TestProto.importProto(raw);
                assert.equal(test1.data, test2.data);
            }

            Test().then(done, done);
        });

        it("bytes", (done) => {
            async function Test() {

                @ProtobufElement({ name: "test" })
                class TestProto extends ObjectProto {
                    @ProtobufProperty({ name: "data", id: 1 })
                    public data: ArrayBuffer;
                }

                const test1 = new TestProto();
                test1.data = util.Convert.FromUtf8String("Hello");

                const raw = await test1.exportProto();

                const test2 = await TestProto.importProto(raw);
                assert.isTrue(util.isEqual(test1.data, test2.data));
            }

            Test().then(done, done);
        });

        it("uint32", (done) => {
            async function Test() {

                @ProtobufElement({ name: "test" })
                class TestProto extends ObjectProto {
                    @ProtobufProperty({ name: "data", id: 1, type: "uint32" })
                    public data: number;
                }

                const test1 = new TestProto();
                test1.data = 3;

                const raw = await test1.exportProto();

                const test2 = await TestProto.importProto(raw);
                assert.equal(test1.data, test2.data);
            }

            Test().then(done, done);
        });

        it("bool", (done) => {
            async function Test() {

                @ProtobufElement({ name: "test" })
                class TestProto extends ObjectProto {
                    @ProtobufProperty({ name: "data", id: 1, type: "bool" })
                    public data: boolean;
                }

                const test1 = new TestProto();
                test1.data = true;

                const raw = await test1.exportProto();

                const test2 = await TestProto.importProto(raw);
                assert.equal(test1.data, test2.data);
            }

            Test().then(done, done);
        });

    });

    context("Converters", () => {

        it("array buffer", (done) => {
            async function Test() {

                @ProtobufElement({ name: "test" })
                class TestProto extends ObjectProto {
                    @ProtobufProperty({ name: "data", id: 1, type: "bytes", converter: ArrayBufferConverter })
                    public data: ArrayBuffer;
                }

                const test1 = new TestProto();
                test1.data = util.Convert.FromUtf8String("Hello");

                const raw = await test1.exportProto();

                const test2 = await TestProto.importProto(raw);
                assert.isTrue(util.isEqual(test1.data, test2.data));
            }

            Test().then(done, done);
        });

        it("string", (done) => {
            async function Test() {

                @ProtobufElement({ name: "test" })
                class TestProto extends ObjectProto {
                    @ProtobufProperty({ name: "data", id: 1, type: "bytes", converter: StringConverter })
                    public data: string;
                }

                const test1 = new TestProto();
                test1.data = "Hello";

                const raw = await test1.exportProto();

                const test2 = await TestProto.importProto(raw);
                assert.equal(test1.data, test2.data);
            }

            Test().then(done, done);
        });

    });

    context("options", () => {

        context("optional", () => {

            it("optional with default value", (done) => {
                async function Test() {

                    @ProtobufElement({ name: "test" })
                    class TestProto extends ObjectProto {
                        @ProtobufProperty({ name: "version", id: 1, type: "uint32", required: true })
                        public version: number;

                        @ProtobufProperty({ name: "data", id: 2, type: "bytes", converter: StringConverter, defaultValue: "empty" })
                        public data: string;
                    }

                    const test1 = new TestProto();
                    test1.version = 1;
                    assert.equal(test1.data, "empty");

                    const raw = await test1.exportProto();

                    const test2 = await TestProto.importProto(raw);
                    assert.equal(test2.data, test2.data);
                    assert.equal(test2.data, "empty");
                }

                Test().then(done, done);
            });

        });

    });

    it("isEmpty", () => {
        @ProtobufElement({ name: "test" })
        class TestProto extends ObjectProto {
            @ProtobufProperty({ name: "data", id: 1, type: "bytes", converter: StringConverter })
            public data: string;
        }

        const test = new TestProto();

        assert.isTrue(test.isEmpty());

        test.data = "Some data";

        assert.isFalse(test.isEmpty());
    });

    context("hasChanged", () => {

        it("without children", () => {
            @ProtobufElement({ name: "test" })
            class TestProto extends ObjectProto {
                @ProtobufProperty({ name: "data", id: 1, type: "bytes", converter: StringConverter })
                public data: string;
            }

            const test = new TestProto();

            assert.isFalse(test.hasChanged());

            test.data = "Some data";

            assert.isTrue(test.hasChanged());

        });

        it("with children", () => {

            @ProtobufElement({ name: "child" })
            class ChildProto extends ObjectProto {
                @ProtobufProperty({ name: "data", id: 1, type: "bytes", converter: StringConverter })
                public data: string;
            }

            @ProtobufElement({ name: "parent" })
            class ParentProto extends ObjectProto {
                @ProtobufProperty({ name: "child", id: 1, type: "bytes", parser: ChildProto })
                public child: ChildProto;
            }

            const parent = new ParentProto();

            assert.isFalse(parent.hasChanged());

            parent.child.data = "Some data";

            assert.isTrue(parent.hasChanged());

        });

    });

    context("importProto", () => {

        it("wrong data", (done) => {
            (async () => {
                @ProtobufElement({ name: "test" })
                class TestProto extends ObjectProto {
                    @ProtobufProperty({ name: "data", id: 1, type: "bytes", converter: StringConverter })
                    public data: string;
                }

                const buffer = new Uint8Array([9, 8, 7, 6, 5, 4, 3, 2, 1]).buffer;
                try {
                    await TestProto.importProto(buffer);
                    assert.isTrue(false, "Must be error");
                } catch (e) {
                    // console.log("success");
                }
            })().then(done, done);
        });

    });

    context("exportProto", () => {

        it("export cached data", (done) => {
            (async () => {
                @ProtobufElement({ name: "test" })
                class TestProto extends ObjectProto {
                    @ProtobufProperty({ name: "data", id: 1, type: "bytes", converter: StringConverter })
                    public data: string;
                }

                const test = new TestProto();
                test.data = "some data";

                assert.isTrue(test.hasChanged());
                await test.exportProto();
                assert.isFalse(test.hasChanged());
                await test.exportProto();

            })().then(done, done);
        });

    });

    context("parser", () => {

        it("base", (done) => {
            (async () => {
                @ProtobufElement({ name: "child" })
                class ChildProto extends ObjectProto {
                    @ProtobufProperty({ name: "data", id: 1, type: "bytes", converter: StringConverter })
                    public data: string;
                }

                @ProtobufElement({ name: "parent" })
                class ParentProto extends ObjectProto {
                    @ProtobufProperty({ name: "child", id: 1, type: "bytes", parser: ChildProto })
                    public child: ChildProto;
                }

                const parent = new ParentProto();
                parent.child.data = "Some data";

                const raw = await parent.exportProto();

                const parent2 = await ParentProto.importProto(raw);

                assert.equal(parent.child.data, parent2.child.data);
            })().then(done, done);
        });

        it("required", (done) => {
            (async () => {
                @ProtobufElement({ name: "child" })
                class ChildProto extends ObjectProto {
                    @ProtobufProperty({ name: "data", id: 1, type: "bytes", converter: StringConverter })
                    public data: string;
                }

                @ProtobufElement({ name: "parent" })
                class ParentProto extends ObjectProto {
                    @ProtobufProperty({ name: "child", id: 1, type: "bytes", parser: ChildProto, required: true })
                    public child: ChildProto;
                    @ProtobufProperty({ name: "version", id: 2, type: "uint32" })
                    public version: number;
                }

                const parent = new ParentProto();

                parent.version = 1;

                // try to export data without require property
                try {
                    await parent.exportProto();
                    assert.isTrue(false, "Must be error");
                } catch (e) {
                    // console.log("success");
                }
                parent.child.data = "Some data";

                const raw = await parent.exportProto();

                const parent2 = await ParentProto.importProto(raw);

                assert.equal(parent.child.data, parent2.child.data);
            })().then(done, done);
        });

        it("import without required data", (done) => {
            (async () => {
                @ProtobufElement({ name: "child" })
                class ChildProto extends ObjectProto {
                    @ProtobufProperty({ name: "data", id: 1, type: "bytes", converter: StringConverter })
                    public data: string;
                }

                @ProtobufElement({ name: "parent" })
                class ParentProto extends ObjectProto {
                    @ProtobufProperty({ name: "child", id: 1, type: "bytes", parser: ChildProto })
                    public child: ChildProto;
                    @ProtobufProperty({ name: "version", id: 2, type: "uint32" })
                    public version: number;
                }
                @ProtobufElement({ name: "parent" })
                class ParentWithRequiredProto extends ObjectProto {
                    @ProtobufProperty({ name: "child", id: 1, type: "bytes", parser: ChildProto, required: true })
                    public child: ChildProto;
                    @ProtobufProperty({ name: "version", id: 2, type: "uint32" })
                    public version: number;
                }

                const parent = new ParentProto();

                parent.version = 1;

                const raw = await parent.exportProto();

                // try to import data without require property
                try {
                    await ParentWithRequiredProto.importProto(raw);
                    assert.isTrue(false, "Must be error");
                } catch (e) {
                    // console.log("success");
                }
            })().then(done, done);
        });

    });

    context("converter", () => {
        it("import without required data", (done) => {
            (async () => {
                @ProtobufElement({ name: "parent" })
                class ParentProto extends ObjectProto {
                    @ProtobufProperty({ name: "child", id: 1, type: "bytes", converter: StringConverter })
                    public data: string;
                    @ProtobufProperty({ name: "version", id: 2, type: "uint32" })
                    public version: number;
                }
                @ProtobufElement({ name: "parent" })
                class ParentWithRequiredProto extends ObjectProto {
                    @ProtobufProperty({ name: "child", id: 1, type: "bytes", converter: StringConverter, required: true })
                    public data: string;
                    @ProtobufProperty({ name: "version", id: 2, type: "uint32" })
                    public version: number;
                }

                const parent = new ParentProto();

                parent.version = 1;

                const raw = await parent.exportProto();

                // try to import data without require property
                try {
                    await ParentWithRequiredProto.importProto(raw);
                    assert.isTrue(false, "Must be error");
                } catch (e) {
                    // console.log("success");
                }
            })().then(done, done);
        });
        it("export without required data", (done) => {
            (async () => {
                @ProtobufElement({ name: "parent" })
                class ParentProto extends ObjectProto {
                    @ProtobufProperty({ name: "child", id: 1, type: "bytes", converter: StringConverter, required: true })
                    public data: string;
                    @ProtobufProperty({ name: "version", id: 2, type: "uint32" })
                    public version: number;
                }

                const parent = new ParentProto();

                parent.version = 1;

                // try to import data without require property
                try {
                    await parent.exportProto();
                    assert.isTrue(false, "Must be error");
                } catch (e) {
                    // console.log("success");
                }
            })().then(done, done);
        });

    });

    context("repeated", () => {

        it("simple type", (done) => {
            (async () => {

                @ProtobufElement({ name: "Test" })
                class Test extends ObjectProto {

                    public static INDEX = 0;

                    @ProtobufProperty({ type: "string", id: Test.INDEX++, repeated: true })
                    public names: string[];
                }

                const test = new Test();
                test.names = [];

                test.names.push("1");
                test.names.push("2");
                test.names.push("3");
                test.names.push("4");
                test.names.push("5");

                assert.equal(test.names.length, 5);

                const raw = await test.exportProto();

                const test2 = await Test.importProto(raw);

                assert.equal(test2.names.length, test.names.length);
                assert.equal(test2.names.join(","), "1,2,3,4,5");

            })().then(done, done);
        });

        it("converter type", (done) => {
            (async () => {

                @ProtobufElement({ name: "Test" })
                class Test extends ObjectProto {

                    public static INDEX = 0;

                    @ProtobufProperty({ type: "bytes", id: Test.INDEX++, repeated: true, converter: StringConverter })
                    public names: string[];
                }

                const test = new Test();
                test.names = [];

                test.names.push("1");
                test.names.push("2");
                test.names.push("3");
                test.names.push("4");
                test.names.push("5");

                assert.equal(test.names.length, 5);

                const raw = await test.exportProto();

                const test2 = await Test.importProto(raw);

                assert.equal(test2.names.length, test.names.length);
                assert.equal(test2.names.join(","), "1,2,3,4,5");

            })().then(done, done);
        });

        it("parser type", (done) => {
            (async () => {

                @ProtobufElement({ name: "Child" })
                class Child extends ObjectProto {

                    public static INDEX = 0;

                    @ProtobufProperty({ id: Child.INDEX++, type: "uint32" })
                    public id: number;


                    @ProtobufProperty({ id: Child.INDEX++, type: "string" })
                    public name: string;

                    public constructor();
                    public constructor(id: number, name: string);
                    public constructor(id?: number, name?: string) {
                        super();
                        if (id && name) {
                            this.name = name;
                            this.id = id;
                        }
                    }

                }

                @ProtobufElement({ name: "Test" })
                class Test extends ObjectProto {

                    public static INDEX = 0;

                    @ProtobufProperty({ type: "bytes", id: Test.INDEX++, repeated: true, parser: Child })
                    public children: Child[];
                }

                const test = new Test();
                test.children = [];

                test.children.push(new Child(1, "1"));
                test.children.push(new Child(2, "2"));
                test.children.push(new Child(3, "3"));

                assert.equal(test.children.length, 3);

                const raw = await test.exportProto();

                const test2 = await Test.importProto(raw);

                assert.equal(test2.children.length, test.children.length);
                test.children.forEach((item, index) => {
                    assert.equal(test.children[index].id, test2.children[index].id);
                    assert.equal(test.children[index].name, test2.children[index].name);
                });

            })().then(done, done);
        });

    });

});
