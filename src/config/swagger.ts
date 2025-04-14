import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Rick and Morty Character API',
      version: '1.0.0',
      description: 'API for searching Rick and Morty characters with caching',
      contact: {
        name: 'API Support',
        url: 'https://example.com',
        email: 'support@example.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/models/*.ts'], // Paths to files with JSDoc annotations
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;