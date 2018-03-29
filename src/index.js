import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/css/bootstrap-theme.css';

import './index.css';
import ParticipantList from './components/ParticipantList';
import ParticipantDetail from './components/ParticipantDetail';

ReactDOM.render(
    <Router>
	<Switch>
	    <Route exact path='/' component={ParticipantList} />
	    <Route path='/participant/:index' component={ParticipantDetail} />
	</Switch>
    </Router>,
    document.getElementById('root')
);
