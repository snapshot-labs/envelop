import path from 'path';
import dotenv from 'dotenv';

module.exports = async () => {
  dotenv.config({ path: path.resolve(__dirname, './.env.test') });
};
