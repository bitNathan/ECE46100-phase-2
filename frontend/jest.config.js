module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest', // Transform TypeScript files using ts-jest
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  collectCoverage: true, // Enable coverage collection
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}', // Include all TypeScript files in src directory
    '!src/**/*.test.{ts,tsx}', // Exclude test files
    '!src/index.tsx', // Exclude entry point (if needed)
  ],
  coverageDirectory: 'coverage', // Output coverage reports to this directory
  coverageReporters: ['text', 'lcov'], // Generate text and lcov reports
};
