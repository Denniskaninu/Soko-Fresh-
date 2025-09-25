ck# GreenTrust Backend

The GreenTrust Backend powers an agricultural marketplace application, connecting farmers and buyers. It provides robust APIs for user authentication, crop management, marketplace listings, inquiries, and notifications.

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Database Setup](#database-setup)
  - [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Scripts](#scripts)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

## Features

- **User Authentication:** Secure registration, login, and session management using JWT.
- **Farmer Management:** APIs for farmers to manage their crop listings, harvest batches, and interact with buyers.
- **Buyer Management:** APIs for buyers to browse marketplace listings, make inquiries, and manage purchases.
- **Crop Management:** Define and manage various crop templates and harvest batches.
- **Marketplace:** Create, list, and browse agricultural products.
- **Inquiry System:** Facilitate communication between farmers and buyers regarding listings.
- **Notifications:** Real-time notifications for important events.
- **Security:** Implemented with `helmet` for HTTP header security and `express-rate-limit` to prevent abuse.
- **Caching:** Utilizes Redis for efficient data caching.
- **Real-time Communication:** Powered by Socket.IO for instant updates.

## Technologies Used

- **Node.js:** JavaScript runtime environment.
- **Express.js:** Web application framework for Node.js.
- **PostgreSQL:** Robust relational database.
- **Sequelize:** ORM for PostgreSQL.
- **JWT (JSON Web Tokens):** For secure authentication.
- **Bcrypt.js:** For password hashing.
- **Joi:** For request validation.
- **Redis:** In-memory data store for caching.
- **Socket.IO:** For real-time, bidirectional event-based communication.
- **Helmet:** For securing HTTP headers.
- **Express Rate Limit:** For basic rate-limiting.
- **UUID:** For generating unique identifiers.
- **QR Code:** For generating QR codes.

## Getting Started

Follow these instructions to set up and run the GreenTrust backend on your local machine.

### Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (LTS version recommended)
- npm (comes with Node.js)
- PostgreSQL
- Redis

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/Green-trust.git
   cd Green-trust/backened
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

### Environment Variables

Create a `.env` file in the `backened/` directory and add the following environment variables:

```
PORT=3000
DATABASE_URL="postgresql://user:password@host:port/database"
JWT_SECRET="your_jwt_secret_key"
REDIS_URL="redis://localhost:6379"
SMS_API_KEY="your_sms_api_key"
SMS_SENDER_ID="your_sms_sender_id"
```

- `PORT`: The port on which the server will run.
- `DATABASE_URL`: Connection string for your PostgreSQL database.
- `JWT_SECRET`: A strong, secret key for signing JWTs.
- `REDIS_URL`: Connection string for your Redis instance.
- `SMS_API_KEY`: API key for your SMS service (e.g., Twilio, Africa's Talking).
- `SMS_SENDER_ID`: Sender ID for your SMS service.

### Database Setup

1. **Run database migrations:**
   ```bash
   npm run migrate
   ```

2. **Seed the database (optional, for initial data):**
   ```bash
   npm run seed
   ```

### Running the Application

- **Development Mode (with hot-reloading):**
  ```bash
  npm run dev
  ```

- **Production Mode:**
  ```bash
  npm start
  ```

The server will start on the port specified in your `.env` file (default: `3000`).

## API Documentation

Detailed API documentation can be found in `API_DOCUMENTATION.md`. This file outlines all available endpoints, request/response formats, and authentication requirements.

## Project Structure

```
backened/
├── src/
│   ├── config/           # Configuration files (database, auth)
│   ├── controllers/      # Business logic for handling requests
│   ├── middleware/       # Express middleware (authentication, validation, error handling)
│   ├── models/           # Sequelize models for database interaction
│   ├── routes/           # API routes definitions
│   ├── services/         # External service integrations (e.g., SMS)
│   ├── utils/            # Utility functions
│   ├── cache.js          # Redis caching implementation
│   └── socket.js         # Socket.IO real-time communication setup
├── migrations/           # Database migration files
├── seeders/              # Database seed files
├── scripts/              # Utility scripts (migrate, seed)
├── tests/                # Unit and integration tests
├── .gitignore            # Specifies intentionally untracked files
├── API_DOCUMENTATION.md  # Detailed API endpoint documentation
├── package.json          # Project metadata and dependencies
├── package-lock.json     # Records the exact dependency tree
└── server.js             # Main application entry point
```

## Scripts

- `npm start`: Starts the application in production mode.
- `npm run dev`: Starts the application in development mode with `nodemon`.
- `npm run migrate`: Runs all pending database migrations.
- `npm run seed`: Seeds the database with initial data.
- `npm test`: Runs the test suite using Mocha.

## Testing

The backend includes a comprehensive test suite using Mocha and Chai.
To run tests:

```bash
npm test
```

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
