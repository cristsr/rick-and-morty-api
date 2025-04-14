 
import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../db';
import Location from './Location';

interface CharacterAttributes {
  id: number;
  name: string;
  status: string;
  species: string;
  type: string;
  gender: string;
  image: string;
  api_id: number;
  origin_id?: number;
  location_id?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface CharacterInput extends Optional<CharacterAttributes, 'id'> {}
export interface CharacterOutput extends Required<CharacterAttributes> {}

class Character extends Model<CharacterAttributes, CharacterInput> implements CharacterAttributes {
  id!: number;
  name!: string;
  status!: string;
  species!: string;
  type!: string;
  gender!: string;
  image!: string;
  api_id!: number;
  origin_id?: number;
  location_id?: number;
  readonly created_at!: Date;
  readonly updated_at!: Date;

  // Associations
  readonly origin?: Location;
  readonly location?: Location;
}

Character.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    species: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    gender: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    api_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    origin_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'locations',
        key: 'id',
      },
    },
    location_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'locations',
        key: 'id',
      },
    },
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  },
  {
    tableName: 'characters',
    sequelize,
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

// Define associations
Character.belongsTo(Location, { foreignKey: 'origin_id', as: 'origin' });
Character.belongsTo(Location, { foreignKey: 'location_id', as: 'location' });

export default Character;