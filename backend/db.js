const mongoose = require('mongoose');

const connectDB = async () => {
  const url = process.env.MONGO_URL;
  const dbName = process.env.DB_NAME;
  if (!url || !dbName) {
    throw new Error('MONGO_URL and DB_NAME must be set in environment');
  }
  await mongoose.connect(url, { dbName });
  console.log(`[db] connected to MongoDB (db=${dbName})`);
};

module.exports = connectDB;
