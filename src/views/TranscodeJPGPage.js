import React from "react";
import {Checkmark} from 'react-checkmark';
import {Link} from "react-router-dom";
import {Spinner, Button, Col} from "reactstrap";


const fetch = require('node-fetch');
var process = require('process');

const address = process.env.SERVER_ADDRESS;

class TranscodeJPGPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      project: null,
      completed: false,
    };

    this.displayIncomplete = this.displayIncomplete.bind(this);
    this.displayComplete = this.displayComplete.bind(this);
  }

  componentDidMount() {
    document.body.classList.toggle("transcodejpg-page");
    fetch(address+'/currentproject').then(res => {
      if (res.ok) {
        res.json().then(json => {
          this.setState({
            project: json.project
          });
        })
      }
      else {
        console.error(`GET /currentproject at TranscodeJPGPage: ${res.status} ${res.statusText}`);
      }
    })
  }
  componentWillUnmount() {
    if (this.state.cancelled) {
      fetch(address+'/abortjpgtranscode').then(res => {
        if (!res.ok) {
          console.error(`GET /abortjpgtranscode at TranscodeJPGPage: ${res.status} ${res.statusText}`);
        }
      });
    }
    document.body.classList.toggle("transcodejpg-page");
  }

  componentDidUpdate(prevProps, prevState) {
    // retrieve state from backend
    fetch(address+'/istranscodingjpgcomplete').then(res => {
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
        console.error(`GET /istranscodingjpgcomplete at TranscodeJPGPage: ${res.status} ${res.statusText}`);
      }
    })
  }


  abortTranscode() {
    fetch(address+'/abortjpgtranscode').then(res => {
      if (!res.ok) {
        console.error(`GET /abortjpgtranscode at NewProjectPage: ${res.status} ${res.statusText}`);
      }
    });
  }

  displayIncomplete() {
    return (
      <>
        <h1>Transcoding {this.state.project} JPGs</h1>
        <div>
          <div style={{ alignSelf: "center", width: '6rem', height: '6rem' }}>
            <Spinner type="grow" color="info" />
          </div>
          <h3>Extracting JPG frames, please wait...</h3>
        </div>
        <Link to="/">
          <Button color="primary" onclick={this.abortTranscode}>Cancel</Button>
        </Link>
      </>
    );
  }

  displayComplete() {
    return (
      <>
        <h1>Transcoding {this.state.project} JPGs</h1>
        <div>
          <Checkmark size='xxLarge' />
          <h3>All JPG frames extracted</h3>
        </div>
        <Link to="/select">
          <Button color="primary">OK</Button>
        </Link>
      </>
    );
  }

  render() {
    return (
      <>
        {this.state.completed ? this.displayIncomplete() : this.displayComplete}
      </>
    );
  }
}

export default TranscodeJPGPage;
