 
import { gql } from 'apollo-server-express';

const typeDefs = gql`
  type Query {
    character(id: ID!): Character
    characters(page: Int, filter: CharacterFilter): Characters
  }

  type Character {
    id: ID!
    name: String!
    status: String!
    species: String!
    type: String
    gender: String!
    origin: Location
    location: Location
    image: String!
    created: String
  }

  type Location {
    id: ID
    name: String
    type: String
    dimension: String
  }

  type Characters {
    info: Info
    results: [Character]
  }

  type Info {
    count: Int
    pages: Int
    next: Int
    prev: Int
  }

  input CharacterFilter {
    name: String
    status: String
    species: String
    type: String
    gender: String
    origin: String
  }
`;

export default typeDefs;