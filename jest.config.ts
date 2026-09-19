import type { Config } from "jest";

const config: Config = {
  testEnvironment: "node",
  preset: "ts-jest",
  roots: ["<rootDir>/__tests__"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          // Override for test environment — no Next.js specific settings needed
          module: "commonjs",
          esModuleInterop: true,
        },
      },
    ],
  },
  testMatch: ["**/__tests__/**/*.test.ts"],
};

export default config;
