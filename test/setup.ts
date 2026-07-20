const setup = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  const dbName = new URL(process.env.DATABASE_URL).pathname.slice(1);

  if (!dbName.endsWith('_test')) {
    throw new Error('Invalid test database name. Must end with _test');
  }
};

export default setup;
