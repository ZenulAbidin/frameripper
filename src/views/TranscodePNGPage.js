import React from "react";
import {Checkmark} from 'react-checkmark';
import {Link} from "react-router-dom";
import {Spinner, Button, Col} from "reactstrap";

const fetch = require('node-fetch');
var process = require('process');

const address = process.env.SERVER_ADDRESS;

class TranscodePNGPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      project: null,
      completed: false,
      cancelled: false
    };

    this.displayIncomplete = this.displayIncomplete.bind(this);
    this.displayComplete = this.displayComplete.bind(this);
    this.setCancelled = this.setCancelled.bind(this);
  }

  componentDidMount() {
    document.body.classList.toggle("transcodepng-page");
    fetch(address+'/currentproject').then(res => {
      if (res.ok) {
        res.json().then(json => {
          this.setState({
            project: json.project
          });
        })
      }
      else {
        console.error(`GET /currentproject at TranscodePNGPage: ${res.status} ${res.statusText}`);
      }
    })
  }
  componentWillUnmount() {
    if (this.state.cancelled) {
      fetch(address+'/abortpngtranscode').then(res => {
        if (!res.ok) {
          console.error(`GET /abortpngtranscode at TranscodePNGPage: ${res.status} ${res.statusText}`);
        }
      });
    }
    document.body.classList.toggle("transcodepng-page");
  }

  componentDidUpdate(prevProps, prevState) {
    // retrieve state from backend
    fetch(address+'/istranscodingpngcomplete').then(res => {
    	if (res.ok) {
        res.json().then(json => {
          if (json.complete === true) {
            this.setState({
              completed: true
            });
          }
        })
      }
      else {
        console.error(`GET /istranscodingpngcomplete at TranscodePNGPage: ${res.status} ${res.statusText}`);
      }
    })
  }

  displayIncomplete() {
    return (
      <>
        <h1>Transcoding {this.state.project} PNGs</h1>
        <div>
          <div style={{ alignSelf: "center", width: '6rem', height: '6rem' }}>
            <Spinner type="grow" color="info" />
          </div>
          <h3>Extracting PNG frames, please wait...</h3>
        </div>
        <Link to="/">
          <Button color="primary" onclick={this.setCancelled()}>Cancel</Button>
        </Link>
      </>
    );
  }

  displayComplete() {
    return (
      <>
        <h1>Transcoding {this.state.project} PNGs</h1>
        <div>
          <Checkmark size='xxLarge' />
          <h3>All PNG frames extracted</h3>
        </div>
        <Link to="/select">
          <Button color="primary">OK</Button>
        </Link>
      </>
    );
  }

  setCancelled() {
    this.setState({
     cancelled: true
    });
    fetch(address+'/abortpngtranscode').then(res => {
      if (!res.ok) {
        console.error(`GET /abortpngtranscode at NewProjectPage: ${res.status} ${res.statusText}`);
      }
    });
  }

  render() {
    return (
      <>
        {this.state.completed ? this.displayIncomplete() : this.displayComplete}
      </>
    );
  }
}

export default TranscodePNGPage;
