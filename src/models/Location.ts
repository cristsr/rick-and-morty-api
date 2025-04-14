 
import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../db';

interface LocationAttributes {
  id: number;
  name: string;
  type: string;
  dimension: string;
  api_id: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface LocationInput extends Optional<LocationAttributes, 'id'> {}
export interface LocationOutput extends Required<LocationAttributes> {}

class Location extends Model<LocationAttributes, LocationInput> implements LocationAttributes {
  id!: number;
  name!: string;
  type!: string;
  dimension!: string;
  api_id!: number;
  readonly created_at!: Date;
  readonly updated_at!: Date;
}

Location.init(
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
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    dimension: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    api_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  },
  {
    tableName: 'locations',
    sequelize,
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default Location;