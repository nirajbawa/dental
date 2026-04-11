const fs = require('fs');
const path = require('path');
const db = require('./db');

const initializeDatabase = async () => {
    try {
        console.log('Checking if database needs initialization...');
        
        console.log('Running database setup/check from schema.sql...');
        
        // Read schema file
        const schemaPath = path.join(__dirname, '../../database/schema.sql');
            const schema = fs.readFileSync(schemaPath, 'utf8');

            // Remove SQL comments and split into individual queries
            const queries = schema
                .replace(/--.*$/gm, '') // Remove single-line comments
                .replace(/\/\*[\s\S]*?\*\//gm, '') // Remove multi-line comments
                .split(';')
                .map(q => q.trim())
                .filter(q => q.length > 0);

            for (let query of queries) {
                try {
                    await db.query(query);
                } catch (err) {
                    // Ignore "already exists" errors if any, but log others
                    if (!err.message.includes('already exists')) {
                        console.error(`Error executing query: ${query.substring(0, 50)}...`);
                        console.error(err.message);
                    }
                }
            }
            console.log('Database initialization complete.');
    } catch (err) {
        console.error('Database initialization FAILED:', err.message);
        throw err;
    }
};

module.exports = initializeDatabase;
