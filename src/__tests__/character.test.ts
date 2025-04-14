import { ApolloServer } from 'apollo-server-express';
import { 
  characterModelMock,
  redisServiceMock,
  rickAndMortyApiMock,
  mockDbCharacters, 
  mockCachedCharacter,
  GET_CHARACTERS_QUERY,
  GET_CHARACTER_QUERY,
  GET_CHARACTER_BASIC_QUERY,
  testVariables,
  expectedResults
} from './__mocks__/characterMocks';

// Mock other modules before importing resolvers
jest.mock('../models', () => ({
  Character: characterModelMock,
  Location: {},
}));

jest.mock('../services/redis', () => ({
  getCache: redisServiceMock.getCache,
  setCache: redisServiceMock.setCache,
}));

jest.mock('../services/rickAndMortyApi', () => ({
  getCharacterById: rickAndMortyApiMock.getCharacterById,
  getCharacters: rickAndMortyApiMock.getCharacters,
}));

// Import typeDefs and resolvers after setting up the mocks
import typeDefs from '../graphql/schema';
import resolvers from '../graphql/resolvers';

// Configure Apollo server for testing
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

describe('Character GraphQL Queries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('characters query', () => {
    it('should return characters with filters', async () => {
      // Mock that getCache returns null (not in cache)
      redisServiceMock.getCache.mockResolvedValue(null);

      // Mock database data
      const totalCount = 5;
      characterModelMock.count.mockResolvedValue(totalCount);

      // Mock that findAll returns characters from the database
      characterModelMock.findAll.mockResolvedValue(mockDbCharacters);
      
      // Execute query
      const result = await server.executeOperation({
        query: GET_CHARACTERS_QUERY,
        variables: testVariables.characters,
      });

      // Verify that the result has no errors
      expect(result.errors).toBeUndefined();
      
      // Verify that the pagination information matches the expected
      expect(result.data?.characters.info).toEqual(expectedResults.charactersInfo);
      
      // Verify that it returns the correct number of results
      // mockDbCharacters has 2 elements, so we expect 2 results
      expect(result.data?.characters.results).toHaveLength(mockDbCharacters.length);
      
      // Verify that the first result matches the expected
      expect(result.data?.characters.results[0]).toEqual(expectedResults.characterFromDB);

      // Verify that mock functions were called
      expect(redisServiceMock.getCache).toHaveBeenCalled();
      expect(characterModelMock.count).toHaveBeenCalled();
      expect(characterModelMock.findAll).toHaveBeenCalled();
      expect(redisServiceMock.setCache).toHaveBeenCalled();
    });
  });

  describe('character query', () => {
    it('should return a character by ID from cache', async () => {
      // Mock that getCache returns the cached character
      redisServiceMock.getCache.mockResolvedValue(mockCachedCharacter);

      // Execute query
      const result = await server.executeOperation({
        query: GET_CHARACTER_QUERY,
        variables: testVariables.character,
      });

      // Verify result
      expect(result.errors).toBeUndefined();
      expect(result.data?.character).toEqual(expectedResults.characterFromCache);

      // Verify that the cache was queried
      expect(redisServiceMock.getCache).toHaveBeenCalledWith('character:1');
      expect(characterModelMock.findOne).not.toHaveBeenCalled();
    });

    it('should return a character by ID from database when not in cache', async () => {
      // Mock that getCache returns null (not in cache)
      redisServiceMock.getCache.mockResolvedValue(null);

      // Mock that findOne returns the character from the database
      characterModelMock.findOne.mockResolvedValue(mockDbCharacters[0]);

      // Execute query
      const result = await server.executeOperation({
        query: GET_CHARACTER_BASIC_QUERY,
        variables: testVariables.character,
      });

      // Verify result
      expect(result.errors).toBeUndefined();
      expect(result.data?.character).toEqual(expectedResults.characterFromDB);

      // Verify that the database was queried
      expect(redisServiceMock.getCache).toHaveBeenCalledWith('character:1');
      expect(characterModelMock.findOne).toHaveBeenCalled();
      expect(redisServiceMock.setCache).toHaveBeenCalled();
    });
  });
}); 