import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import {
  RecoilRoot,
} from 'recoil';

import { ThemeProvider, rootTheme } from './themes';
import I18nProvider from './I18nProvider';
import './css/Colors.css';
import './css/Fonts.css';

import ParticipantList from './components/ParticipantList';
import DiscoveryApp from './components/DiscoveryApp';

export const PATIENT_MODE_SEGMENT = '/:patientMode(participant|uploaded)';

ReactDOM.render(
  <RecoilRoot>
    <ThemeProvider theme={rootTheme}>
      <I18nProvider>
        <Router>
          <Switch>
            <Route
              exact
              path="/"
              component={ParticipantList}
            />
            <Route
              path={`${PATIENT_MODE_SEGMENT}/:participantId/:activeView?`}
              component={DiscoveryApp}
            />
          </Switch>
        </Router>
      </I18nProvider>
    </ThemeProvider>
  </RecoilRoot>,
  document.getElementById('root'),
);
