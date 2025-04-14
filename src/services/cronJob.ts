 
import cron from 'node-cron';
import { Character, Location } from '../models';
import { getCharacterById } from '../utils/rickAndMortyApi';
import { deleteCache } from './redis';

/**
 * Actualiza un personaje si hay cambios en la API externa
 */
const updateCharacter = async (character: any): Promise<boolean> => {
  try {
    // Obtener datos actualizados de la API
    const apiCharacter = await getCharacterById(character.api_id.toString());
    
    if (!apiCharacter) {
      console.log(`Character ${character.api_id} no longer exists in the API`);
      return false;
    }
    
    // Verificar si hay cambios en los datos básicos del personaje
    const hasBasicChanges = 
      character.name !== apiCharacter.name ||
      character.status !== apiCharacter.status ||
      character.species !== apiCharacter.species ||
      character.type !== apiCharacter.type ||
      character.gender !== apiCharacter.gender ||
      character.image !== apiCharacter.image;
    
    // Verificar cambios en origin
    let originChanged = false;
    let originId = character.origin_id;
    
    if (apiCharacter.origin && apiCharacter.origin.name !== 'unknown') {
      if (!character.origin || character.origin.name !== apiCharacter.origin.name) {
        // Buscar o crear la ubicación de origen
        const [origin] = await Location.findOrCreate({
          where: { name: apiCharacter.origin.name },
          defaults: {
            name: apiCharacter.origin.name,
            type: apiCharacter.origin.type || 'unknown',
            dimension: apiCharacter.origin.dimension || 'unknown',
            api_id: parseInt(apiCharacter.origin.id || '0', 10)
          }
        });
        
        originId = origin.id;
        originChanged = true;
      }
    } else if (character.origin_id) {
      // Si tenía un origen pero ya no
      originId = null;
      originChanged = true;
    }
    
    // Verificar cambios en location
    let locationChanged = false;
    let locationId = character.location_id;
    
    if (apiCharacter.location && apiCharacter.location.name !== 'unknown') {
      if (!character.location || character.location.name !== apiCharacter.location.name) {
        // Buscar o crear la ubicación actual
        const [location] = await Location.findOrCreate({
          where: { name: apiCharacter.location.name },
          defaults: {
            name: apiCharacter.location.name,
            type: apiCharacter.location.type || 'unknown',
            dimension: apiCharacter.location.dimension || 'unknown',
            api_id: parseInt(apiCharacter.location.id || '0', 10)
          }
        });
        
        locationId = location.id;
        locationChanged = true;
      }
    } else if (character.location_id) {
      // Si tenía una ubicación pero ya no
      locationId = null;
      locationChanged = true;
    }
    
    // Si hay cambios, actualizar el registro
    if (hasBasicChanges || originChanged || locationChanged) {
      await Character.update(
        {
          name: apiCharacter.name,
          status: apiCharacter.status,
          species: apiCharacter.species,
          type: apiCharacter.type || '',
          gender: apiCharacter.gender,
          image: apiCharacter.image,
          origin_id: originId,
          location_id: locationId
        },
        { where: { id: character.id } }
      );
      
      // Invalidar la caché
      await deleteCache(`character:${character.api_id}`);
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error updating character ${character.id}:`, error);
    return false;
  }
};

/**
 * Inicializa la tarea CRON para actualizar personajes cada 12 horas
 */
export const initCharacterUpdateCron = () => {
  // Ejecutar cada 12 horas (0 */12 * * *)
  cron.schedule('0 */12 * * *', async () => {
    console.log('Running character update CRON job...');
    
    try {
      // Obtener todos los personajes de la base de datos
      const characters = await Character.findAll({
        include: [
          { model: Location, as: 'origin' },
          { model: Location, as: 'location' }
        ]
      });
      
      console.log(`Found ${characters.length} characters to check for updates`);
      
      let updatedCount = 0;
      
      // Actualizar cada personaje si es necesario
      for (const character of characters) {
        const updated = await updateCharacter(character);
        if (updated) {
          updatedCount++;
        }
      }
      
      console.log(`Updated ${updatedCount} characters in the database`);
    } catch (error) {
      console.error('Error in character update CRON job:', error);
    }
  });
  
  console.log('Character update CRON job scheduled');
};

export default initCharacterUpdateCron;