import { Op } from 'sequelize';
import { Character, Location } from '../models';
import { getCache, setCache } from '../services/redis';
import { measureExecutionTime } from '../decorators/performance';
import { getCharacterById, getCharacters } from '../services/rickAndMortyApi';

class CharacterResolver {
  /**
   * Gets a character by ID
   */
  @measureExecutionTime()
  async getCharacterById(id: string): Promise<any> {
    try {
      // Check if exists in cache
      const cacheKey = `character:${id}`;
      const cachedCharacter = await getCache(cacheKey);
      
      if (cachedCharacter) {
        console.log(`Character ${id} found in cache`);
        return cachedCharacter;
      }
      
      // Search in the database
      const character = await Character.findOne({
        where: { api_id: parseInt(id, 10) },
        include: [
          { model: Location, as: 'origin' },
          { model: Location, as: 'location' }
        ]
      });
      
      if (character) {
        // Format the result to match the GraphQL schema
        const formattedCharacter = this.formatCharacter(character);
        
        // Save in cache
        await setCache(cacheKey, formattedCharacter, 3600); // 1 hour TTL
        
        return formattedCharacter;
      }
      
      // If not in the database, get from external API
      const apiCharacter = await getCharacterById(id);
      
      if (apiCharacter) {
        // Save in cache
        await setCache(cacheKey, apiCharacter, 3600); // 1 hour TTL
        
        // We could also save to the database here if needed
        
        return apiCharacter;
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching character ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Gets characters with optional filters
   */
  @measureExecutionTime()
  async getCharacters(page: number = 1, filter: any = {}): Promise<any> {
    try {
      // Create cache key based on parameters
      const filterKey = JSON.stringify(filter);
      const cacheKey = `characters:page=${page}:filter=${filterKey}`;
      
      // Check if exists in cache
      const cachedResult = await getCache(cacheKey);
      if (cachedResult) {
        console.log(`Characters query found in cache: ${cacheKey}`);
        return cachedResult;
      }
      
      // Build filter conditions for Sequelize
      const whereConditions: any = {};
      
      if (filter.name) {
        whereConditions.name = { [Op.iLike]: `%${filter.name}%` };
      }
      
      if (filter.status) {
        whereConditions.status = filter.status;
      }
      
      if (filter.species) {
        whereConditions.species = filter.species;
      }
      
      if (filter.type) {
        whereConditions.type = filter.type;
      }
      
      if (filter.gender) {
        whereConditions.gender = filter.gender;
      }
      
      // Origin filter requires a join with the locations table
      let originFilter = {};
      if (filter.origin) {
        originFilter = {
          model: Location,
          as: 'origin',
          where: {
            name: { [Op.iLike]: `%${filter.origin}%` }
          }
        };
      } else {
        originFilter = {
          model: Location,
          as: 'origin'
        };
      }
      
      // Calculate offset for pagination
      const limit = 20; // Number of results per page
      const offset = (page - 1) * limit;
      
      // Count total results for info
      const totalCount = await Character.count({
        where: whereConditions,
        include: filter.origin ? [originFilter] : []
      });
      
      // Obtener resultados paginados
      const characters = await Character.findAll({
        where: whereConditions,
        include: [
          originFilter,
          { model: Location, as: 'location' }
        ],
        limit,
        offset
      });
      
      // Calculate pagination information
      const totalPages = Math.ceil(totalCount / limit);
      const nextPage = page < totalPages ? page + 1 : null;
      const prevPage = page > 1 ? page - 1 : null;
      
      // Format results according to GraphQL schema
      const formattedCharacters = characters.map(this.formatCharacter);
      
      const result = {
        info: {
          count: totalCount,
          pages: totalPages,
          next: nextPage,
          prev: prevPage
        },
        results: formattedCharacters
      };
      
      // Save in cache
      await setCache(cacheKey, result, 3600); // 1 hour TTL
      
      return result;
    } catch (error) {
      console.error('Error fetching characters:', error);
      
      // If database fails, try with external API
      try {
        const apiResult = await getCharacters(page, filter);
        return apiResult;
      } catch (apiError) {
        console.error('Error fetching from external API:', apiError);
        throw apiError;
      }
    }
  }
  
  /**
   * Formats a Sequelize Character object to the format expected by GraphQL
   */
  private formatCharacter(character: any): any {
    return {
      id: character.api_id.toString(),
      name: character.name,
      status: character.status,
      species: character.species,
      type: character.type ?? '',
      gender: character.gender,
      origin: character.origin ? {
        id: character.origin?.api_id?.toString() ?? null,
        name: character.origin?.name,
        type: character.origin?.type,
        dimension: character.origin?.dimension
      } : null,
      location: character.location ? {
        id: character.location?.api_id?.toString() ?? null,
        name: character.location?.name,
        type: character.location?.type,
        dimension: character.location?.dimension
      } : null,
      image: character.image,
      created: character.created_at?.toISOString() ?? null
    };
  }
}

// Instance of the resolver to use in Apollo resolvers
const characterResolver = new CharacterResolver();

// Define resolvers for Apollo Server
const resolvers = {
  Query: {
    character: (_: any, { id }: { id: string }) => 
      characterResolver.getCharacterById(id),
    characters: (_: any, { page, filter }: { page?: number, filter?: any }) => 
      characterResolver.getCharacters(page, filter)
  }
};

export default resolvers;