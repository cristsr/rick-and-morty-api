'use strict';
const axios = require('axios');

// Función para obtener personajes de la API de Rick y Morty
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
      // Obtener personajes de la API
      const characters = await fetchCharacters(15);
      
      // Mapear y almacenar ubicaciones únicas (origin y location)
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
      
      // Preparar datos de ubicaciones para insertar
      const locationsToInsert = Array.from(locationsMap.values()).map(location => ({
        ...location,
        created_at: new Date(),
        updated_at: new Date()
      }));
      
      // Insertar ubicaciones
      await queryInterface.bulkInsert('locations', locationsToInsert, {});
      
      // Obtener las ubicaciones insertadas para hacer referencia en los personajes
      const dbLocations = await queryInterface.sequelize.query(
        'SELECT id, name, api_id FROM locations',
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );
      
      // Mapear ubicaciones por nombre para fácil referencia
      const locationsByName = {};
      dbLocations.forEach(loc => {
        locationsByName[loc.name] = loc.id;
      });
      
      // Preparar datos de personajes para insertar
      const charactersToInsert = characters.map(character => {
        // Determinar referencias a ubicaciones
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
      
      // Insertar personajes
      return await queryInterface.bulkInsert('characters', charactersToInsert, {});
    } catch (error) {
      console.error('Seeding error:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Eliminar todos los registros
    await queryInterface.bulkDelete('characters', null, {});
    await queryInterface.bulkDelete('locations', null, {});
  }

}