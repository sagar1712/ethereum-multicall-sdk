module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!ethers|chai)/', 
  ],
  testEnvironment: "node",
    setupFilesAfterEnv: ["./jest.setup.js"]
};
