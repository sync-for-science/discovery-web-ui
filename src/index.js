import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

import './css/s4s_discovery03.css';
import ParticipantList from './components/ParticipantList';
import DiscoveryApp from './components/DiscoveryApp';

ReactDOM.render(
    <Router>
	<Switch>
	    <Route exact path='/' component={ParticipantList} />
	    <Route path='/participant/:index' component={DiscoveryApp} />
	</Switch>
    </Router>,
    document.getElementById('root')
);
