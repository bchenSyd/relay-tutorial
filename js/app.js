import 'babel-polyfill';

import App from './components/App';
import React from 'react';
import ReactDOM from 'react-dom';
import Relay from 'react-relay';


//option 1:
//import AppHomeRoute from './routes/AppHomeRoute';
class AppHomeRoute extends Relay.Route {
  static routeName = 'AppHomeRoute';
  static queries = {
    game: () => Relay.QL`query { game }`,
  };

}
ReactDOM.render(
  <Relay.Renderer
    environment={Relay.Store}
    Container={App}
    queryConfig={new AppHomeRoute()}
    />,
  document.getElementById('root')
);


//option 2:
/*
class HomeRoute extends Relay.Route {
  static routeName = 'Home';
  static queries = {
    rootQuery: (Component) => Relay.QL`query{
          store{
             ${Component.getFragment('rootQuery')}
          }
       }`
  }
}


render(<Relay.RootContainer
  Component={LandingPage} 
  route={new HomeRoute()} />, root)    */