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

});
