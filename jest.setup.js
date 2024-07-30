expect.extend({
    toBeBigInt(received, expected) {
      const pass = received === BigInt(expected);
      if (pass) {
        return {
          message: () => `expected ${received} not to be BigInt(${expected})`,
          pass: true,
        };
      } else {
        return {
          message: () => `expected ${received} to be BigInt(${expected})`,
          pass: false,
        };
      }
    },
  });