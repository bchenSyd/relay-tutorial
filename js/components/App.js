import CheckHidingSpotForTreasureMutation from '../mutations/CheckHidingSpotForTreasureMutation';
import React from 'react';
import Relay from 'react-relay';

class App extends React.Component {
  //this.props.relay comes from HOC RelayContainer
  //RelayContainer.state.relayProp {applyUpdate, commitUpdate...etc}
  _getHidingSpotStyle(hidingSpot) {
    let color;
    //hasOptimisticUpdate(record) ?? getPendingTransactions(record/node)   ??
    if (this.props.relay.hasOptimisticUpdate(hidingSpot)) {
      color = 'yellow';
    } else if (hidingSpot.hasBeenChecked) {
      if (hidingSpot.hasTreasure) {
        color = 'blue';
      } else {
        color = 'red';
      }
    } else {
      color = 'black';
    }
    return {
      backgroundColor: color,
      cursor: this._isGameOver() ? null : 'pointer',
      display: 'inline-block',
      height: 100,
      marginRight: 10,
      width: 100,
    };
  }
  _handleHidingSpotClick(hidingSpot) {
    if (this._isGameOver()) {
      return;
    }
    this.props.relay.commitUpdate(
      new CheckHidingSpotForTreasureMutation({
        game: this.props.game,
        hidingSpot,
      })
    );
  }
  _hasFoundTreasure() {
    return (
      this.props.game.hidingSpots.edges.some(edge => edge.node.hasTreasure)
    );
  }
  _isGameOver() {
    return !this.props.game.turnsRemaining || this._hasFoundTreasure();
  }
  renderGameBoard() {
    return this.props.game.hidingSpots.edges.map(edge => {
      return (
        <div
          key={edge.node.id}
          onClick={this._handleHidingSpotClick.bind(this, edge.node)}
          style={this._getHidingSpotStyle(edge.node)}
        />
      );
    });
  }

  onClick = event =>{
    this.forceUpdate()
  }
  render() {
    let headerText;
    const pendingTrx = this.props.relay.getPendingTransactions(this.props.game)
    if (pendingTrx) {
      headerText = '\u2026';
    } else if (this._hasFoundTreasure()) {
      headerText = 'You win!';
    } else if (this._isGameOver()) {
      headerText = 'Game over!';
    } else {
      headerText = 'Find the treasure!';
    }
    return (
      <div>
        <h1>{headerText}</h1>
        {this.renderGameBoard()}
        <p>Turns remaining: {this.props.game.turnsRemaining}</p>
        <button onClick={this.onClick} >ForceUpdate</button>
      </div>
    );
  }
}

export default Relay.createContainer(App, {
  fragments: {
    game: () => Relay.QL`
      fragment on Game {
        turnsRemaining,
        #get hidingSpot connection;
        hidingSpots(first: 9) {
          edges {
            node {
              hasBeenChecked,
              hasTreasure,
              id,
              ${CheckHidingSpotForTreasureMutation.getFragment('hidingSpot')},
            }
          }
        },
        #get everything for game;
        ${CheckHidingSpotForTreasureMutation.getFragment('game')},
      }
    `,
  },
});

/*
 edges {
      node {
        hasBeenChecked,  #1
        hasTreasure,   #2
        id, #3
        ${CheckHidingSpotForTreasureMutation.getFragment('hidingSpot')},  #4
#4 belongs to the hard dependency of a muation;
#1, #2, #3 are going to be intersected with #4: fatQuery, for server to determine what to return back after a mutation;
 */