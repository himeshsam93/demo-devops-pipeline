module.exports = {
  testEnvironment: "node",
  verbose: true,
  testMatch: ["**/tests/**/*.test.js"],
  reporters: [
    "default",
    [ "jest-junit", { "outputDirectory": "./reports/junit", "outputName": "junit.xml" } ]
  ]
};
