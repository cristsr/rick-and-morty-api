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

// Cargar variables de entorno
dotenv.config();

// Crear aplicación Express
const app: Application = express();

// Configurar middlewares
app.use(cors());
app.use(json());
app.use(requestLogger);

// Configurar Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => ({ req }),
  introspection: true,
  debug: process.env.NODE_ENV !== 'production',
});

// Configurar Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Ruta de health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Inicializa el servidor
 */
export const initServer = async () => {
  try {
    // Iniciar Apollo Server
    await server.start();
    
    // Aplicar middleware de Apollo a Express
    await server.applyMiddleware({ app: app as any });
    
    // Probar conexión a la base de datos
    await sequelize.authenticate();
    console.log('Database connection established successfully');
    
    // Iniciar CRON job para actualizar personajes
    initCharacterUpdateCron();
    
    return app;
  } catch (error) {
    console.error('Error initializing server:', error);
    throw error;
  }
};

export default app;