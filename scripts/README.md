# Slideshow Migration Script

This script migrates data from MySQL to Neon PostgreSQL.

## Prerequisites

- Node.js (v14 or higher)
- MySQL database with existing data
- Neon PostgreSQL database connection details

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the scripts directory with the following variables:
```env
MYSQL_HOST=your_mysql_host
MYSQL_USER=your_mysql_user
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=your_mysql_database

NEON_HOST=your_neon_host
NEON_USER=your_neon_user
NEON_PASSWORD=your_neon_password
NEON_DATABASE=your_neon_database
```

## Running the Migration

1. Build the TypeScript code:
```bash
npm run build
```

2. Run the migration:
```bash
npm start
```

The script will:
- Connect to both MySQL and Neon PostgreSQL databases
- Retrieve all photos and videos from MySQL
- Insert the data into Neon PostgreSQL
- Log the number of records migrated
- Close the database connections

## Error Handling

If any errors occur during the migration:
- The error will be logged to the console
- Database connections will be properly closed
- The process will exit with a non-zero status code 