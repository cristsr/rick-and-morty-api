 
import { Op } from 'sequelize';
import { Character, Location } from '../models';
import { getCache, setCache } from '../services/redis';
import { measureExecutionTime } from '../decorators/performance';
import { getCharacterById, getCharacters } from '../utils/rickAndMortyApi';

class CharacterResolver {
  /**
   * Obtiene un personaje por ID
   */
  @measureExecutionTime()
  async getCharacterById(id: string): Promise<any> {
    try {
      // Verificar si existe en caché
      const cacheKey = `character:${id}`;
      const cachedCharacter = await getCache(cacheKey);
      
      if (cachedCharacter) {
        console.log(`Character ${id} found in cache`);
        return cachedCharacter;
      }
      
      // Buscar en la base de datos
      const character = await Character.findOne({
        where: { api_id: parseInt(id, 10) },
        include: [
          { model: Location, as: 'origin' },
          { model: Location, as: 'location' }
        ]
      });
      
      if (character) {
        // Formatear el resultado para que coincida con el esquema GraphQL
        const formattedCharacter = this.formatCharacter(character);
        
        // Guardar en caché
        await setCache(cacheKey, formattedCharacter, 3600); // 1 hora TTL
        
        return formattedCharacter;
      }
      
      // Si no está en la base de datos, obtener de la API externa
      const apiCharacter = await getCharacterById(id);
      
      if (apiCharacter) {
        // Guardar en caché
        await setCache(cacheKey, apiCharacter, 3600); // 1 hora TTL
        
        // También podríamos guardar en la base de datos aquí si es necesario
        
        return apiCharacter;
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching character ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Obtiene personajes con filtros opcionales
   */
  @measureExecutionTime()
  async getCharacters(page: number = 1, filter: any = {}): Promise<any> {
    try {
      // Crear clave de caché basada en parámetros
      const filterKey = JSON.stringify(filter);
      const cacheKey = `characters:page=${page}:filter=${filterKey}`;
      
      // Verificar si existe en caché
      const cachedResult = await getCache(cacheKey);
      if (cachedResult) {
        console.log(`Characters query found in cache: ${cacheKey}`);
        return cachedResult;
      }
      
      // Construir las condiciones de filtro para Sequelize
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
      
      // El filtro de origin requiere un join con la tabla de locations
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
      
      // Calcular offset para paginación
      const limit = 20; // Número de resultados por página
      const offset = (page - 1) * limit;
      
      // Contar total de resultados para info
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
      
      // Calcular información de paginación
      const totalPages = Math.ceil(totalCount / limit);
      const nextPage = page < totalPages ? page + 1 : null;
      const prevPage = page > 1 ? page - 1 : null;
      
      // Formatear resultados según el esquema GraphQL
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
      
      // Guardar en caché
      await setCache(cacheKey, result, 3600); // 1 hora TTL
      
      return result;
    } catch (error) {
      console.error('Error fetching characters:', error);
      
      // Si falla la base de datos, intentar con la API externa
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
   * Formatea un objeto Character de Sequelize al formato esperado por GraphQL
   */
  private formatCharacter(character: any): any {
    return {
      id: character.api_id.toString(),
      name: character.name,
      status: character.status,
      species: character.species,
      type: character.type || '',
      gender: character.gender,
      origin: character.origin ? {
        id: character.origin.api_id ? character.origin.api_id.toString() : null,
        name: character.origin.name,
        type: character.origin.type,
        dimension: character.origin.dimension
      } : null,
      location: character.location ? {
        id: character.location.api_id ? character.location.api_id.toString() : null,
        name: character.location.name,
        type: character.location.type,
        dimension: character.location.dimension
      } : null,
      image: character.image,
      created: character.created_at ? character.created_at.toISOString() : null
    };
  }
}

// Instancia del resolver para usarla en los resolvers de Apollo
const characterResolver = new CharacterResolver();

// Definir resolvers para Apollo Server
const resolvers = {
  Query: {
    character: (_: any, { id }: { id: string }) => 
      characterResolver.getCharacterById(id),
    characters: (_: any, { page, filter }: { page?: number, filter?: any }) => 
      characterResolver.getCharacters(page, filter)
  }
};

export default resolvers;