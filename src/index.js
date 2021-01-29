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

import { ThemeProvider, rootTheme } from './themes';
import './css/Colors.css';
import './css/Fonts.css';

import ParticipantList from './components/ParticipantList';
import DiscoveryApp from './components/DiscoveryApp';

ReactDOM.render(
  <RecoilRoot>
    <ThemeProvider theme={rootTheme}>
      <Router>
        <Switch>
          <Route exact path="/" component={ParticipantList} />
          <Route path="/participant/:participantId/:activeView?" component={DiscoveryApp} />
          <Route path="/uploaded/:uploadId" component={DiscoveryApp} />
        </Switch>
      </Router>
    </ThemeProvider>
  </RecoilRoot>,
  document.getElementById('root'),
);
