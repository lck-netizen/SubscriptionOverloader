const mongoose = require('mongoose');

async function dropLegacyUserIdIndex() {
  const users = mongoose.connection.db.collection('users');
  const indexes = await users.indexes();
  const hasLegacyIdIndex = indexes.some((index) => index.name === 'id_1');

  if (!hasLegacyIdIndex) {
    return;
  }

  await users.dropIndex('id_1');
  console.log('[db] dropped legacy users.id_1 index');
}

const connectDB = async () => {
  const url = process.env.MONGO_URL;
  const dbName = process.env.DB_NAME;
  if (!url || !dbName) {
    throw new Error('MONGO_URL and DB_NAME must be set in environment');
  }
  await mongoose.connect(url, { dbName });
  await dropLegacyUserIdIndex();
  console.log(`[db] connected to MongoDB (db=${dbName})`);
};

module.exports = connectDB;
