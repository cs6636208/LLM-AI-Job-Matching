import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.js'],
    coverage: {
      provider: 'v8',
      include: ['validate.js', 'logger.js'],
    },
  },
});
