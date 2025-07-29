const mongoose = require('mongoose');

class Database {
  constructor() {
    this.connection = null;
  }

  async connect(connectionString = 'mongodb://localhost:27017/vulnerable_company') {
    try {
      this.connection = await mongoose.connect(connectionString, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      
      console.log('MongoDB connected successfully');
      return this.connection;
    } catch (error) {
      console.error('Database connection error:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.connection) {
      await mongoose.disconnect();
      console.log('MongoDB disconnected');
    }
  }

  // VULNERABLE: Raw query execution without sanitization
  async executeRawQuery(collection, query) {
    // Allows direct MongoDB queries - dangerous for user input
    const db = mongoose.connection.db;
    return await db.collection(collection).find(query).toArray();
  }

  // VULNERABLE: Dynamic collection access
  async queryCollection(collectionName, filters) {
    // User can specify any collection name
    const db = mongoose.connection.db;
    return await db.collection(collectionName).find(filters).toArray();
  }
}

module.exports = new Database();