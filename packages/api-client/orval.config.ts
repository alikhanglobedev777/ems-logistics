import { defineConfig } from "orval";

export default defineConfig({
  emsApi: {
    input: {
      target: "../api-contract/openapi.yaml"
    },
    output: {
      mode: "tags-split",
      target: "src/generated/api.ts",
      schemas: "src/generated/models",
      client: "react-query",
      clean: true,
      override: {
        mutator: {
          path: "./src/http-client.ts",
          name: "customHttpClient"
        }
      }
    }
  }
});
