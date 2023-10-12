import db from '../src/helpers/mysql';

const teardown = async () => {
  await db.endAsync();
};

export default teardown;
