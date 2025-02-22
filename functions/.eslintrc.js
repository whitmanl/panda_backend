module.exports = {
  parser: "@babel/eslint-parser",
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
  env: {
    node: true,
    es6: true,
  },
  extends: ["eslint:recommended", "plugin:node/recommended"],
  plugins: ["node"],
};
