import typescript from "rollup-plugin-typescript2";
import pkg from "./package.json" assert { type: "json" };

const external = Object.keys(pkg.dependencies);
const banner = [].join("\n");
const input = "src/index.ts";

export default [
  // main
  {
    input,
    plugins: [
      typescript({
        check: true,
        clean: true,
        tsconfigOverride: {
          compilerOptions: {
            module: "ES2015",
            removeComments: true,
          }
        }
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
];