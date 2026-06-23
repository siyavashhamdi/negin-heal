import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "http://localhost:4000/graphql",
  documents: ["src/**/*.{ts,tsx}", "!src/lib/graphql/generated/**/*"],
  generates: {
    "./src/lib/graphql/generated/": {
      preset: "client",
      plugins: [],
      presetConfig: {
        gqlTagName: "gql",
        fragmentMasking: false,
      },
    },
  },
  ignoreNoDocuments: true,
  config: {
    // Create const-enum-like objects:
    enumsAsConst: true,

    // IMPORTANT: keep enum member names exactly as in the schema
    namingConvention: {
      enumValues: "keep",
    },

    // (optional) you can drop this now, it's not needed:
    // enumValues: (_enumName: string, enumValue: string) => enumValue,
  },
};

export default config;
