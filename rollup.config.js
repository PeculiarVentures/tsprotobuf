import { dts, ts } from "rollup-plugin-dts";

const pkg = require("./package.json");
const external = Object.keys(pkg.dependencies);
const banner = [].join("\n");
const input = "src/class/index.ts";

export default [
  // main
  {
    input,
    plugins: [
      ts({
        compilerOptions: {
          removeComments: true,
        },
      }),
    ],
    external,
    output: [
      {
        banner,
        file: pkg.main,
        format: "cjs",
      },
      {
        banner,
        file: pkg.module,
        format: "es",
      }
    ]
  },
  // types
  {
    input,
    plugins: [
      dts(),
    ],
    external,
    output: [
      {
        banner,
        file: pkg.types,
        format: "es",
      }
    ]
  },
];