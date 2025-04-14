// Character model mocks
export const characterModelMock = {
  findOne: jest.fn(),
  findAll: jest.fn(),
  count: jest.fn().mockResolvedValue(5),
};

// Location model mocks
export const locationModelMock = {};

// Redis service mocks
export const redisServiceMock = {
  getCache: jest.fn(),
  setCache: jest.fn(),
};

// Rick and Morty API mocks
export const rickAndMortyApiMock = {
  getCharacterById: jest.fn(),
  getCharacters: jest.fn(),
};

// Test variables
export const testVariables = {
  characters: {
    page: 1,
    filter: {
      status: "Alive",
      species: "Human"
    }
  },
  character: {
    id: '1'
  }
};

// Expected results
export const expectedResults = {
  charactersInfo: {
    count: 5,
    pages: 1,
    next: null,
    prev: null
  },
  characterFromCache: {
    id: '1',
    name: 'Rick Sanchez',
    status: 'Alive',
    species: 'Human',
    gender: 'Male',
    origin: { name: 'Earth' }
  },
  characterFromDB: {
    id: '1',
    name: 'Rick Sanchez',
    status: 'Alive',
    species: 'Human',
    gender: 'Male',
  }
};

// Mock character data
export const mockDbCharacters = [
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

export const mockCachedCharacter = {
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

// GraphQL queries used in tests
export const GET_CHARACTERS_QUERY = `
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
  }`;

export const GET_CHARACTER_QUERY = `
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
  }`;

export const GET_CHARACTER_BASIC_QUERY = `
  query GetCharacter($id: ID!) {
    character(id: $id) {
      id
      name
      status
      species
      gender
    }
  }`;

// Setup mocks function
export const setupMocks = () => {
  // Avoid re-mocking if already mocked
  jest.mock('../../models', () => ({
    Character: characterModelMock,
    Location: locationModelMock,
  }));

  jest.mock('../../services/redis', () => ({
    getCache: redisServiceMock.getCache,
    setCache: redisServiceMock.setCache,
  }));

  jest.mock('../../services/rickAndMortyApi', () => ({
    getCharacterById: rickAndMortyApiMock.getCharacterById,
    getCharacters: rickAndMortyApiMock.getCharacters,
  }));
}; 