/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from 'graphql';

import {
  connectionArgs,
  connectionDefinitions,
  connectionFromArray,
  fromGlobalId,
  globalIdField,
  mutationWithClientMutationId,
  nodeDefinitions,
} from 'graphql-relay';

import {
  Game,
  HidingSpot,
  checkHidingSpotForTreasure,
  getGame,
  getHidingSpot,
  getHidingSpots,
  getTurnsRemaining,
} from './database';

//******************************************************************************************
//                     Define Query
//******************************************************************************************
// step 1: let's define a node interface and type
// We need only provide a way for Relay to map 
// 1. given a global ID, you need to return me the object
// 2. given an Object , you need to tell me the graphQLType
const {nodeInterface, nodeField} = nodeDefinitions(
  (globalId) => {
    const {type, id} = fromGlobalId(globalId);
    if (type === 'Game') {
      return getGame(id);
    } else if (type === 'HidingSpot') {
      return getHidingSpot(id);
    } else {
      return null;
    }
  },
  (obj) => {
    if (obj instanceof Game) {
      return gameType;
    } else if (obj instanceof HidingSpot) {
      return hidingSpotType;
    } else {
      return null;
    }
  }
);


// step 2: now let's define the graphQLTypes 
//(these 3 types must be declared in the right order, 
// ES6 DOES allow you to refer to variables that are defined later) BUT TYPE SCRIPT WON'T!  TYPE SCRIPT IS VERY STRICT
// 2.1 define HidingSpot Type (must be defined first, becuase it's reference later on)
const hidingSpotType = new GraphQLObjectType({
  name: 'HidingSpot',
  description: 'A place where you might find treasure',
  fields: () => ({
    id: globalIdField('HidingSpot'),
    hasBeenChecked: {
      type: GraphQLBoolean,
      description: 'True if this spot has already been checked for treasure',
      resolve: (hidingSpot) => hidingSpot.hasBeenChecked,
    },
    hasTreasure: {
      type: GraphQLBoolean,
      description: 'True if this hiding spot holds treasure',
      resolve: (hidingSpot) => {
        if (hidingSpot.hasBeenChecked) {
          return hidingSpot.hasTreasure;
        } else {
          return null;  // Shh... it's a secret!
        }
      },
    },
  }),
  interfaces: [nodeInterface],
});

// 2.2 define collection type/ list type / connectionType
//this is how you give destructing assignment a new vairable name
const {connectionType: hidingSpotConnection} = //note we assign a new variale name `hidingSpotConnection`
  connectionDefinitions({ name: 'HidingSpot', nodeType: hidingSpotType });

// 2.3 Define GameType
const gameType = new GraphQLObjectType({
  name: 'Game',
  description: 'A treasure search game',
  fields: () => ({
    id: globalIdField('Game'),
    hidingSpots: {
      //==========================> here is how the connectionType/collection type/ list type is used
      type: hidingSpotConnection,
      description: 'Places where treasure might be hidden',
      args: connectionArgs,
      resolve: (game, args) => connectionFromArray(getHidingSpots(), args),
    },
    turnsRemaining: {
      type: GraphQLInt,
      description: 'The number of turns a player has left to find the treasure',
      resolve: () => getTurnsRemaining(),
    },
  }),
  interfaces: [nodeInterface],
});

/********************************************************************************* */
const queryType = new GraphQLObjectType({
  name: 'Query',
  fields: () => ({
    node: nodeField,
    game: {
      type: gameType,
      resolve: () => getGame(),
    },
  }),
});

/*


type Query {
  # Fetches an object given its ID
  node(
    # The ID of an object
    id: ID!
  ): Node
  game: Game
}


human readable:
Query is a name of a graphQLObject type, it has 2 fields, 
1. one named node, which is of type Node
# An object with an ID
interface Node {
  # The id of the object.
  id: ID!
}

2. and the other one called game, which is of type Game

type Game implements Node {
  # The ID of an object
  id: ID!

  # Places where treasure might be hidden
  hidingSpots(after: String, first: Int, before: String, last: Int): HidingSpotConnection

  # The number of turns a player has left to find the treasure
  turnsRemaining: Int
}


 */

//********************************************************************************** */

//******************************************************************************************
//                    Define Mutation
//******************************************************************************************



// inputFields  + clientMutationId => CheckHidingSpotForTreasureInput;
// outputFields + clientMutationId => CheckHidingSpotForTreasurePayload
const CheckHidingSpotForTreasureMutation = mutationWithClientMutationId({
  name: 'CheckHidingSpotForTreasure',
  //1. we define mutation input parameter(s)
  inputFields: {
    id: { type: new GraphQLNonNull(GraphQLID) },
  },
  //2.  and a list of fields that the client MIGHT/MAY need to update UI for ==> corresponding to fatQuery
  outputFields: {
    hidingSpot: { //hasBeenChecked.hasBeenChecked changed;
      type: hidingSpotType,
      resolve: ({localHidingSpotId}) => getHidingSpot(localHidingSpotId),
    },
    game: { //game won't get changed in this case, but may be in some other cases
      type: gameType,
      resolve: () => getGame(),
    },
  },
  //3. Finally, we implement a method that performs the underlying mutation
  //   the actual mutation functin may return a promise
  mutateAndGetPayload: ({id}) => {
    const localHidingSpotId = fromGlobalId(id).id;
    return new Promise(resolve => {
      setTimeout(() => {
        checkHidingSpotForTreasure(localHidingSpotId);

        resolve({ localHidingSpotId });
    }, 2*1000)
    })
  },
});

/**************************************************************************************************************************************** */
const mutationType = new GraphQLObjectType({
  name: 'Mutation',
  fields: () => ({
    checkHidingSpotForTreasure: CheckHidingSpotForTreasureMutation,
  }),
});
                         // schema.graphql version

// type Mutation {
//   checkHidingSpotForTreasure(input: CheckHidingSpotForTreasureInput!): CheckHidingSpotForTreasurePayload
// }

                      // human readable version
/*   Mutation (the graphqlObjecttype name)  is an graphQLObjectType, and it has a field , which is like a function, that takes in an 
CheckHidingSpotForTreasureInput (not null) and returns an CheckHidingSpotForTreasurePayload
*/
/**************************************************************************************************************************************** */








//finally , export the query and mutation
export const Schema = new GraphQLSchema({
  query: queryType,
  mutation: mutationType
});