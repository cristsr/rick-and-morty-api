# Rick and Morty Character API

An API to search for Rick and Morty characters implementing GraphQL, Redis cache, and PostgreSQL persistence.

## Index
- [Description](#description)
- [Project Structure](#project-structure)
- [Requirements](#requirements)
- [Installation](#installation)
- [Usage](#usage)
- [Database Structure](#database-structure)
- [Endpoints](#endpoints)
- [Query Examples](#query-examples)
- [Tests](#tests)

## Description

This API allows you to search for Rick and Morty characters, with filtering capabilities by name, status, species, gender, and origin.

Main features:
- GraphQL API implemented with Apollo Server and Express
- PostgreSQL database with Sequelize ORM
- Redis cache to improve performance
- CRON task for automatic data updates
- Logging middleware to record request information
- Decorator to measure query execution time
- Unit tests with Jest
- Documentation with Swagger

## Project Structure

```
.
├── src/
│   ├── config/           # Configurations (database, swagger)
│   ├── db/               # Database connection
│   ├── decorators/       # Custom decorators
│   ├── graphql/          # GraphQL schemas and resolvers
│   ├── middleware/       # Express middlewares
│   ├── migrations/       # Sequelize migrations
│   ├── models/           # Sequelize models
│   ├── seeders/          # Initial data seeds
│   ├── services/         # Services (Redis, CRON, Data Fetcher)
│   ├── __tests__/        # Unit tests
│   ├── app.ts            # Application configuration
│   └── index.ts          # Application entry point
├── .env.example          # Environment variables example
├── .eslintrc.js          # ESLint configuration
├── .sequelizerc          # Sequelize CLI configuration
├── docker-compose.yml    # Docker Compose configuration
├── Dockerfile            # Docker configuration
├── jest.config.js        # Jest configuration
├── package.json          # Project dependencies
├── tsconfig.json         # TypeScript configuration
└── README.md             # Project documentation
```

## Requirements

- Node.js >= 14.x
- Docker and Docker Compose
- Git

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/rick-and-morty-api.git
   cd rick-and-morty-api
   ```

2. Create environment variables file:
   ```bash
   cp .env.example .env
   ```

3. Start containers with Docker Compose:
   ```bash
   docker-compose up -d
   ```

4. Run migrations and seeders:
   ```bash
   docker-compose exec app npm run migrate
   docker-compose exec app npm run seed
   ```

## Usage

Once the application is running, you can access:

- GraphQL Playground: http://localhost:4000/graphql
- API Documentation: http://localhost:4000/api-docs
- Health Check: http://localhost:4000/health

## Database Structure

The application uses two main tables:

- **characters**: Stores information about Rick and Morty characters.
- **locations**: Stores information about locations (origin and current location of characters).

![ERD Diagram](./erd-diagram.png)

## Endpoints

### GraphQL

- **URL**: `/graphql`
- **Method**: POST
- **Description**: Main endpoint for GraphQL queries.

## Query Examples

### Get a character by ID

```graphql
query {
  character(id: "1") {
    id
    name
    status
    species
    gender
    origin {
      name
      type
      dimension
    }
    location {
      name
      type
      dimension
    }
    image
  }
}
```

### Search characters with filters

```graphql
query {
  characters(
    page: 1, 
    filter: { 
      name: "Rick", 
      status: "Alive", 
      species: "Human" 
    }
  ) {
    info {
      count
      pages
      next
      prev
    }
    results {
      id
      name
      status
      species
      gender
      origin {
        name
      }
      image
    }
  }
}
```

## Tests

To run unit tests:

```bash
docker-compose exec app npm test
```

## License

This project is licensed under the ISC License.
