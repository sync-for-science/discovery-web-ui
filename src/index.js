import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import {
  RecoilRoot,
  // atom,
  // selector,
  // useRecoilState,
  // useRecoilValue,
} from 'recoil';

import './css/Colors.css';
import './css/Fonts.css';

import ParticipantList from './components/ParticipantList';
import DiscoveryApp from './components/DiscoveryApp';

ReactDOM.render(
  <RecoilRoot>
    <Router>
      <Switch>
        <Route exact path="/" component={ParticipantList} />
        <Route path="/participant/:participantId/:activeView?" component={DiscoveryApp} />
        <Route path="/uploaded/:id" component={DiscoveryApp} />
      </Switch>
    </Router>
  </RecoilRoot>,
  document.getElementById('root'),
);
