# Database Initialization Script

This script initializes the PostgreSQL database with the required tables.

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database connection details

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the scripts directory with the following variables:
```env
DATABASE_URL=your_postgresql_connection_string
```

## Running the Script

1. Build the TypeScript code:
```bash
npm run build
```

2. Run the initialization:
```bash
npm run migrate
```

The script will:
- Connect to your PostgreSQL database
- Create all necessary tables if they don't exist
- Log the initialization progress
- Close the database connection

## Error Handling

If any errors occur during initialization:
- The error will be logged to the console
- Database connection will be properly closed
- The process will exit with a non-zero status code 