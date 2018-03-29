import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/css/bootstrap-theme.css';

import './index.css';
import PatientList from './components/PatientList';
import PatientDetail from './components/PatientDetail';

ReactDOM.render(
    <Router>
	<Switch>
	    <Route exact path='/' component={PatientList} />
	    <Route path='/patient/:index' component={PatientDetail} />
	</Switch>
    </Router>,
    document.getElementById('root')
);
