import Relay from 'react-relay';

export default class CheckHidingSpotForTreasureMutation extends Relay.Mutation {
  //***************** hard dependency declaration ********************** */
  static fragments = {
    game: () => Relay.QL`
      fragment on Game {
        id,
        turnsRemaining,
      }
    `,
    hidingSpot: () => Relay.QL`
      fragment on HidingSpot {
        id,
      }
    `,
  };
//*************************************************** */

  //which mutation? checkHidingSpotForTreasure is the filed name (think of a muation as a function, this is the function name);
  getMutation() {
    return Relay.QL`mutation{checkHidingSpotForTreasure}`;
  }
  getCollisionKey() {
    return `check_${this.props.game.id}`;
  }

  // Use this method to design a ‘fat query’ – one that represents every
  // field in your data model that could change as a result of this mutation
  // tell the server what to return (performance tunning)

  // make this as 'fat' as possible, as it's going to be intersected with the 'tracked query' later
  // tracked query is the query that retrieve data for the react component render function
  // ***********    the approach in GraphQL is for clients (`react-relay`) to query for things that may change after a mutation.
  //       But what exactly do we put in that query? 
  // fatQuery intersect (inner join) traced query
  // ***********    In addition to the cache of data,  Relay also remembers the queries used to fetch each item.    **************
  getFatQuery() { 
    return Relay.QL`
      fragment on CheckHidingSpotForTreasurePayload @relay(pattern: true) {
        hidingSpot {
          hasBeenChecked,
          hasTreasure,
        },
        game {
          turnsRemaining,
        },
      }
    `;
  }
  //what should relay do after `ready` event? i.e. what's the nature of this mutation ?
  //details: https://github.com/bochen2014/relay-digest/tree/master/mutation/RelayMutation.js
  //FIELDS_CHANGE: update a node
  //RANGE_ADD:  add a new edge to a range.
  //NODE_DELETE : remote edge from a range, and delete the node
  // RANGE_DELETE remove edge from a range, but not delete the node
  getConfigs() {
    //tell relay how to handle the payLoad returned by the server;
    //here we say, relay, update record store items with id in passed in fieldIDs list
    //fild name is actually optional
    return [{
      type: 'FIELDS_CHANGE',
      fieldIDs: {
        hidingSpot: this.props.hidingSpot.id,
        game: this.props.game.id,
      },
    }];
  }

  getVariables() {
    //props is specified in Relay.Mutation constructor
    return {
      id: this.props.hidingSpot.id,
    };

  }


  getOptimisticResponse() {
    return {
      game: {
        turnsRemaining: this.props.game.turnsRemaining - 1,
      },
      hidingSpot: {
        id: this.props.hidingSpot.id,
        hasBeenChecked: true,
      },
    };
  }
}