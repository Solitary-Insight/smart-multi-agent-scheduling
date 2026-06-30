const mysql = require("mysql2/promise");
require("dotenv").config();






let pool;

const connectMySQL = async () => {
  if (!pool) {
    pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        timezone: 'Z' // OR '+00:00'
      });
    console.log('✅ Connected to MySQL');
  }
  return pool;
};

 const getDB = () => {
  if (!pool) throw new Error('MySQL not connected. Call connectMySQL() first.');
  return pool;
};


module.exports = {pool,connectMySQL,getDB};