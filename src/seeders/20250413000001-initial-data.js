'use strict';
const axios = require('axios');

// Function to get characters from Rick and Morty API
async function fetchCharacters(limit = 15) {
  try {
    const API_URL = 'https://rickandmortyapi.com/graphql';
    const query = `
      query {
        characters(page: 1) {
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

    const response = await axios.post(API_URL, { query });
    return response.data.data.characters.results.slice(0, limit);
  } catch (error) {
    console.error('Error fetching characters:', error);
    throw error;
  }
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Get characters from API
      const characters = await fetchCharacters(15);
      
      // Map and store unique locations (origin and location)
      const locationsMap = new Map();
      
      characters.forEach(character => {
        if (character.origin && character.origin.name !== 'unknown') {
          const originId = character.origin.id || `origin-${character.id}`;
          locationsMap.set(originId, {
            name: character.origin.name,
            type: character.origin.type || 'unknown',
            dimension: character.origin.dimension || 'unknown',
            api_id: parseInt(originId.replace('origin-', ''), 10)
          });
        }
        
        if (character.location && character.location.name !== 'unknown') {
          const locationId = character.location.id || `location-${character.id}`;
          locationsMap.set(locationId, {
            name: character.location.name,
            type: character.location.type || 'unknown',
            dimension: character.location.dimension || 'unknown',
            api_id: parseInt(locationId.replace('location-', ''), 10)
          });
        }
      });
      
      // Prepare location data for insertion
      const locationsToInsert = Array.from(locationsMap.values()).map(location => ({
        ...location,
        created_at: new Date(),
        updated_at: new Date()
      }));
      
      // Insert locations
      await queryInterface.bulkInsert('locations', locationsToInsert, {});
      
      // Get inserted locations to reference in characters
      const dbLocations = await queryInterface.sequelize.query(
        'SELECT id, name, api_id FROM locations',
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );
      
      // Map locations by name for easy reference
      const locationsByName = {};
      dbLocations.forEach(loc => {
        locationsByName[loc.name] = loc.id;
      });
      
      // Prepare character data for insertion
      const charactersToInsert = characters.map(character => {
        // Determine location references
        let originId = null;
        let locationId = null;
        
        if (character.origin && character.origin.name !== 'unknown') {
          originId = locationsByName[character.origin.name];
        }
        
        if (character.location && character.location.name !== 'unknown') {
          locationId = locationsByName[character.location.name];
        }
        
        return {
          name: character.name,
          status: character.status,
          species: character.species,
          type: character.type || '',
          gender: character.gender,
          image: character.image,
          api_id: parseInt(character.id, 10),
          origin_id: originId,
          location_id: locationId,
          created_at: new Date(),
          updated_at: new Date()
        };
      });
      
      // Insert characters
      return await queryInterface.bulkInsert('characters', charactersToInsert, {});
    } catch (error) {
      console.error('Seeding error:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Delete all records
    await queryInterface.bulkDelete('characters', null, {});
    await queryInterface.bulkDelete('locations', null, {});
  }
}