import dotenv from 'dotenv';
import { initServer } from './app';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 4000;

// Start the server
const main = async  () => {
  try {
    const app = await initServer();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🔍 GraphQL endpoint available at http://localhost:${PORT}/graphql`);
      console.log(`📚 API documentation available at http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();