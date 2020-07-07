
import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter, Route, Switch } from "react-router-dom";

import 'bootstrap/dist/css/bootstrap.css';
import "assets/css/styles.css";
import {wwwencode_partial, wwwencode_form, wwwdecode} from "./Utils.js";


import Index from "views/Index.js";
import NewProjectPage from "views/NewProjectPage.js";
import TranscodeJPGPage from "views/TranscodeJPGPage.js";
import SelectPage from "views/SelectPage.js";
import SettingsPage from "views/SettingsPage.js";
import TranscodePNGPage from "views/TranscodePNGPage.js";


const address = "http://iamomegastorm.tk:3030";

if (address === '' || !address.startsWith('http://') || address.startsWith('https://')) {
  console.error(`WARNING: missing or malformed address ${address}. Server queries will fail.
Check that the SERVER_ADDRESS environment variable is set with the domain IP address and has http:// or https:// in front of it.`)
}


ReactDOM.render(
  <BrowserRouter>
    <Switch>
      <Route exact path="/" render={props => <Index {...props} />} />
      <Route exact
        path="/new"
        render={props => <NewProjectPage {...props} />}
      />
      <Route exact
        path="/transcode-jpg"
        render={props => <TranscodeJPGPage {...props} />}
      />
      <Route exact
        path="/select"
        render={props => <SelectPage {...props} />}
      />
      <Route exact
        path="/settings"
        render={props => <SettingsPage {...props} />}
      />
      <Route exact
        path="/transcode-png"
        render={props => <TranscodePNGPage {...props} />}
      />
    </Switch>
  </BrowserRouter>,
  document.getElementById("root")
);
