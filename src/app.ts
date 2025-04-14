import express, { Application } from 'express';
import cors from 'cors';
import { ApolloServer } from 'apollo-server-express';
import { json } from 'body-parser';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';

import requestLogger from './middleware/logging';
import typeDefs from './graphql/schema';
import resolvers from './graphql/resolvers';
import swaggerSpec from './config/swagger';
import sequelize from './db';
import { initCharacterUpdateCron } from './services/cronJob';

// Load environment variables
dotenv.config();

// Create Express application
const app: Application = express();

// Configure middlewares
app.use(cors());
app.use(json());
app.use(requestLogger);

// Configure Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => ({ req }),
  introspection: true,
  debug: process.env.NODE_ENV !== 'production',
});

// Configure Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Initialize the server
 */
export const initServer = async () => {
  try {
    // Start Apollo Server
    await server.start();
    
    // Apply Apollo middleware to Express
    await server.applyMiddleware({ app: app as any });
    
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully');
    
    // Start CRON job to update characters
    initCharacterUpdateCron();
    
    return app;
  } catch (error) {
    console.error('Error initializing server:', error);
    throw error;
  }
};

export default app;