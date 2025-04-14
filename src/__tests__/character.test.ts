 
import { ApolloServer } from 'apollo-server-express';
import typeDefs from '../graphql/schema';
import resolvers from '../graphql/resolvers';
import { Character, Location } from '../models';
import { getCache, setCache } from '../services/redis';

// Mock las dependencias
jest.mock('../models', () => ({
  Character: {
    findOne: jest.fn(),
    findAll: jest.fn(),
    count: jest.fn(),
  },
  Location: {},
}));

jest.mock('../services/redis', () => ({
  getCache: jest.fn(),
  setCache: jest.fn(),
}));

jest.mock('../utils/rickAndMortyApi', () => ({
  getCharacterById: jest.fn(),
  getCharacters: jest.fn(),
}));

// Configurar servidor Apollo para pruebas
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
      // Mock que getCache devuelve null (no está en caché)
      (getCache as jest.Mock).mockResolvedValue(null);

      // Mock de datos de la base de datos
      const totalCount = 2;
      (Character.count as jest.Mock).mockResolvedValue(totalCount);

      const dbCharacters = [
        {
          id: 1,
          api_id: 1,
          name: 'Rick Sanchez',
          status: 'Alive',
          species: 'Human',
          type: '',
          gender: 'Male',
          image: 'https://rickandmortyapi.com/api/character/avatar/1.jpeg',
          created_at: new Date('2017-11-04T18:48:46.250Z'),
          origin: {
            id: 1,
            api_id: 1,
            name: 'Earth',
            type: 'Planet',
            dimension: 'C-137'
          },
          location: {
            id: 3,
            api_id: 3,
            name: 'Citadel of Ricks',
            type: 'Space station',
            dimension: 'unknown'
          }
        },
        {
          id: 2,
          api_id: 2,
          name: 'Morty Smith',
          status: 'Alive',
          species: 'Human',
          type: '',
          gender: 'Male',
          image: 'https://rickandmortyapi.com/api/character/avatar/2.jpeg',
          created_at: new Date('2017-11-04T18:50:21.651Z'),
          origin: {
            id: 1,
            api_id: 1,
            name: 'Earth',
            type: 'Planet',
            dimension: 'C-137'
          },
          location: {
            id: 3,
            api_id: 3,
            name: 'Citadel of Ricks',
            type: 'Space station',
            dimension: 'unknown'
          }
        }
      ];

      // Mock que findAll devuelve los personajes de la base de datos
      (Character.findAll as jest.Mock).mockResolvedValue(dbCharacters);

      // Ejecutar query
      const result = await server.executeOperation({
        query: `
          query GetCharacters($page: Int, $filter: CharacterFilter) {
            characters(page: $page, filter: $filter) {
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
              }
            }
          }`,
        variables: { 
          page: 1, 
          filter: { 
            status: "Alive",
            species: "Human"
          } 
        },
      });

      // Verificar resultado
      expect(result.errors).toBeUndefined();
      expect(result.data?.characters.info).toEqual({
        count: 2,
        pages: 1,
        next: null,
        prev: null
      });
      expect(result.data?.characters.results).toHaveLength(2);
      expect(result.data?.characters.results[0]).toEqual({
        id: '1',
        name: 'Rick Sanchez',
        status: 'Alive',
        species: 'Human',
        gender: 'Male'
      });

      // Verificar que se consultó la base de datos
      expect(getCache).toHaveBeenCalled();
      expect(Character.count).toHaveBeenCalled();
      expect(Character.findAll).toHaveBeenCalled();
      expect(setCache).toHaveBeenCalled();
    });
  });
});
  describe('character query', () => {
    it('should return a character by ID from cache', async () => {
      // Setup mock data
      const cachedCharacter = {
        id: '1',
        name: 'Rick Sanchez',
        status: 'Alive',
        species: 'Human',
        type: '',
        gender: 'Male',
        origin: { id: '1', name: 'Earth', type: 'Planet', dimension: 'C-137' },
        location: { id: '3', name: 'Citadel of Ricks', type: 'Space station', dimension: 'unknown' },
        image: 'https://rickandmortyapi.com/api/character/avatar/1.jpeg',
        created: '2017-11-04T18:48:46.250Z',
      };

      // Mock que getCache devuelve el personaje cacheado
      (getCache as jest.Mock).mockResolvedValue(cachedCharacter);

      // Ejecutar query
      const result = await server.executeOperation({
        query: `
          query GetCharacter($id: ID!) {
            character(id: $id) {
              id
              name
              status
              species
              gender
              origin {
                name
              }
            }
          }`,
        variables: { id: '1' },
      });

      // Verificar resultado
      expect(result.errors).toBeUndefined();
      expect(result.data?.character).toEqual({
        id: '1',
        name: 'Rick Sanchez',
        status: 'Alive',
        species: 'Human',
        gender: 'Male',
        origin: { name: 'Earth' }
      });

      // Verificar que se consultó la caché
      expect(getCache).toHaveBeenCalledWith('character:1');
      expect(Character.findOne).not.toHaveBeenCalled();
    });

    it('should return a character by ID from database when not in cache', async () => {
      // Mock que getCache devuelve null (no está en caché)
      (getCache as jest.Mock).mockResolvedValue(null);

      // Mock de datos de la base de datos
      const dbCharacter = {
        id: 1,
        api_id: 1,
        name: 'Rick Sanchez',
        status: 'Alive',
        species: 'Human',
        type: '',
        gender: 'Male',
        image: 'https://rickandmortyapi.com/api/character/avatar/1.jpeg',
        created_at: new Date('2017-11-04T18:48:46.250Z'),
        origin: {
          id: 1,
          api_id: 1,
          name: 'Earth',
          type: 'Planet',
          dimension: 'C-137'
        },
        location: {
          id: 3,
          api_id: 3,
          name: 'Citadel of Ricks',
          type: 'Space station',
          dimension: 'unknown'
        }
      };

      // Mock que findOne devuelve el personaje de la base de datos
      (Character.findOne as jest.Mock).mockResolvedValue(dbCharacter);

      // Ejecutar query
      const result = await server.executeOperation({
        query: `
          query GetCharacter($id: ID!) {
            character(id: $id) {
              id
              name
              status
              species
              gender
            }
          }`,
        variables: { id: '1' },
      });

      // Verificar resultado
      expect(result.errors).toBeUndefined();
      expect(result.data?.character).toEqual({
        id: '1',
        name: 'Rick Sanchez',
        status: 'Alive',
        species: 'Human',
        gender: 'Male',
      });

      // Verificar que se consultó la base de datos
      expect(getCache).toHaveBeenCalledWith('character:1');
      expect(Character.findOne).toHaveBeenCalled();
      expect(setCache).toHaveBeenCalled();
    });
  });