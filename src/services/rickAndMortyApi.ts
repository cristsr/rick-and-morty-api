import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = process.env.RICK_AND_MORTY_API_URL as string;

// GraphQL query to get multiple characters
const getCharactersQuery = `
  query getCharacters($page: Int, $filter: FilterCharacter) {
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
        type
        gender
        image
        origin {
          id
          name
          type
          dimension
        }
        location {
          id
          name
          type
          dimension
        }
      }
    }
  }
`;

// GraphQL query to get a character by ID
const getCharacterByIdQuery = `
  query getCharacter($id: ID!) {
    character(id: $id) {
      id
      name
      status
      species
      type
      gender
      image
      origin {
        id
        name
        type
        dimension
      }
      location {
        id
        name
        type
        dimension
      }
    }
  }
`;

/**
 * Gets multiple characters with optional filters
 */
export const getCharacters = async (page = 1, filter: any = {}) => {
  try {
    const response = await axios.post(API_URL, {
      query: getCharactersQuery,
      variables: {
        page,
        filter
      }
    });

    return response.data.data.characters;
  } catch (error) {
    console.error('Error fetching characters:', error);
    throw error;
  }
};

/**
 * Gets a character by ID
 */
export const getCharacterById = async (id: string) => {
  try {
    const response = await axios.post(API_URL, {
      query: getCharacterByIdQuery,
      variables: {
        id
      }
    });

    return response.data.data.character;
  } catch (error) {
    console.error(`Error fetching character with ID ${id}:`, error);
    throw error;
  }
};