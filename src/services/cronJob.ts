import cron from 'node-cron';
import { Character, Location } from '../models';
import { getCharacterById } from './rickAndMortyApi';
import { deleteCache } from './redis';
import { 
  ApiCharacter, 
  ApiLocation, 
  CharacterWithLocations,
  CharacterUpdateData,
  CharacterUpdateResult,
  OriginChangeResult,
  LocationChangeResult
} from '../types';

/**
 * Updates a character if there are changes in the external API
 */
const updateCharacter = async (character: CharacterWithLocations): Promise<boolean> => {
  try {
    const apiCharacter = await getCharacterById(character.api_id.toString());
    
    if (!apiCharacter) {
      console.log(`Character ${character.api_id} no longer exists in the API`);
      return false;
    }
    
    const { hasChanges, updatedData } = await getCharacterChanges(character, apiCharacter);
    
    if (!hasChanges) {
      return false;
    }
    
    await Character.update(updatedData, { where: { id: character.id } });
    await deleteCache(`character:${character.api_id}`);
    
    return true;
  } catch (error) {
    console.error(`Error updating character ${character.id}:`, error);
    return false;
  }
};

/**
 * Checks if the basic character data has changed
 */
const hasBasicInfoChanged = (character: CharacterWithLocations, apiCharacter: ApiCharacter): boolean => {
  return (
    character.name !== apiCharacter.name ||
    character.status !== apiCharacter.status ||
    character.species !== apiCharacter.species ||
    character.type !== apiCharacter.type ||
    character.gender !== apiCharacter.gender ||
    character.image !== apiCharacter.image
  )
};

/**
 * Determines if there are changes between the stored character and the API character
 */
const getCharacterChanges = async (character: CharacterWithLocations, apiCharacter: ApiCharacter): Promise<CharacterUpdateResult> => {
  const hasBasicChanges = hasBasicInfoChanged(character, apiCharacter);
  
  const { originChanged, originId } = await processOriginChanges(character, apiCharacter);
  const { locationChanged, locationId } = await processLocationChanges(character, apiCharacter);
  
  const hasChanges = hasBasicChanges || originChanged || locationChanged;
  
  const updatedData: CharacterUpdateData = {
    name: apiCharacter.name,
    status: apiCharacter.status,
    species: apiCharacter.species,
    type: apiCharacter.type ?? '',
    gender: apiCharacter.gender,
    image: apiCharacter.image,
    origin_id: originId,
    location_id: locationId
  };
  
  return { hasChanges, updatedData };
};

/**
 * Checks if the API origin is null or unknown
 */
const isApiOriginUnknown = (apiOrigin: ApiLocation | null): boolean => {
  return !apiOrigin || apiOrigin.name === 'unknown';
};

/**
 * Checks if the character's origin has changed
 */
const hasOriginChanged = (character: CharacterWithLocations, apiOrigin: ApiLocation): boolean => {
  return !character.origin || character.origin.name !== apiOrigin.name;
};

/**
 * Processes changes in the origin location
 */
const processOriginChanges = async (character: CharacterWithLocations, apiCharacter: ApiCharacter): Promise<OriginChangeResult> => {
  let originChanged = false;
  let originId = character.origin_id;
  
  if (isApiOriginUnknown(apiCharacter.origin)) {
    if (character.origin_id) {
      originId = undefined;
      originChanged = true;
    }
    return { originChanged, originId };
  }
  
  if (apiCharacter.origin && hasOriginChanged(character, apiCharacter.origin)) {
    const [origin] = await Location.findOrCreate({
      where: { name: apiCharacter.origin.name },
      defaults: getLocationDefaults(apiCharacter.origin)
    });
    
    originId = origin.id;
    originChanged = true;
  }
  
  return { originChanged, originId };
};

/**
 * Checks if the API location is null or unknown
 */
const isApiLocationUnknown = (apiLocation: ApiLocation | null): boolean => {
  return !apiLocation || apiLocation.name === 'unknown';
};

/**
 * Checks if the character's location has changed
 */
const hasLocationChanged = (character: CharacterWithLocations, apiLocation: ApiLocation): boolean => {
  return !character.location || character.location.name !== apiLocation.name;
};

/**
 * Processes changes in the current location
 */
const processLocationChanges = async (character: CharacterWithLocations, apiCharacter: ApiCharacter): Promise<LocationChangeResult> => {
  let locationChanged = false;
  let locationId = character.location_id;
  
  if (isApiLocationUnknown(apiCharacter.location)) {
    if (character.location_id) {
      locationId = undefined;
      locationChanged = true;
    }
    return { locationChanged, locationId };
  }
  
  if (apiCharacter.location && hasLocationChanged(character, apiCharacter.location)) {
    const [location] = await Location.findOrCreate({
      where: { name: apiCharacter.location.name },
      defaults: getLocationDefaults(apiCharacter.location)
    });
    
    locationId = location.id;
    locationChanged = true;
  }
  
  return { locationChanged, locationId };
};

/**
 * Gets default values to create a location
 */
const getLocationDefaults = (locationData: ApiLocation): any => {
  return {
    name: locationData.name,
    type: locationData.type || 'unknown',
    dimension: locationData.dimension || 'unknown',
    api_id: parseInt(locationData.id || '0', 10)
  };
};

/**
 * Executes the update of all characters
 */
const runCharacterUpdate = async (): Promise<void> => {
  console.log('Running character update CRON job...');
  
  try {
    const characters = await Character.findAll({
      include: [
        { model: Location, as: 'origin' },
        { model: Location, as: 'location' }
      ]
    }) as CharacterWithLocations[];
    
    console.log(`Found ${characters.length} characters to check for updates`);
    
    let updatedCount = 0;
    
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
};

/**
 * Initializes the CRON task to update characters every 12 hours
 */
export const initCharacterUpdateCron = (): void => {
  cron.schedule('0 */12 * * *', runCharacterUpdate);
  console.log('Character update CRON job scheduled');
};

export default initCharacterUpdateCron;