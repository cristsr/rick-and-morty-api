import { Character, Location } from '../models';

export interface ApiCharacter {
  id: string;
  name: string;
  status: string;
  species: string;
  type: string | null;
  gender: string;
  image: string;
  origin: ApiLocation | null;
  location: ApiLocation | null;
}

export interface ApiLocation {
  id?: string;
  name: string;
  type?: string;
  dimension?: string;
}

export interface CharacterWithLocations extends Character {
  origin?: Location;
  location?: Location;
}

export interface CharacterUpdateData {
  name: string;
  status: string;
  species: string;
  type: string;
  gender: string;
  image: string;
  origin_id?: number;
  location_id?: number;
}

export interface CharacterUpdateResult {
  hasChanges: boolean;
  updatedData: CharacterUpdateData;
}

export interface OriginChangeResult {
  originChanged: boolean;
  originId?: number;
}

export interface LocationChangeResult {
  locationChanged: boolean;
  locationId?: number;
}
