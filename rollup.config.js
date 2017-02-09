import typescript from "rollup-plugin-typescript";

let pkg = require("./package.json");

let banner = [];

export default {
    entry: "src/class/index.ts",
    plugins: [
        typescript({ typescript: require("typescript"), target: "es5", removeComments: true }),
    ],
    banner: banner.join("\n"),
    external: ["protobufjs", "tslib", "pvtsutils"],
    globals: {
        protobufjs: "protobufjs",
        tslib: "tslib",
        pvtsutils: "pvtsutils",
    },
    targets: [
        {
            dest: pkg.main,
            format: "umd",
            moduleName: "tsprotobuf"
        }
    ]
};