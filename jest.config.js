const { withWatchPlugins } = require("jest-expo/config");
const preset = require("jest-expo/jest-preset");

module.exports = {
  ...preset,
  moduleNameMapper: {
    ...preset.moduleNameMapper,
    "^@/assets/(.*)$": "<rootDir>/assets/$1",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testMatch: ["**/*.test.ts", "**/*.test.tsx"],
};
