const { Pool } = require('pg');

// Configure the connection pool
const pool = new Pool({
    connectionString: process.env.DBConnLink,
    ssl: {
        rejectUnauthorized: false, // Only necessary if you're connecting over SSL and want to accept self-signed certificates
    }
});

module.exports = pool;