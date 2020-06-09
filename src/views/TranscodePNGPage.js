import React from "react";
import {Checkmark} from 'react-checkmark';
const fetch = require('node-fetch');
var process = require('process');
import {Progress, Button, Col, Link} from "reactstrap";

const address = process.env.SERVER_ADDRESS;

class TranscodePNGPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      project: undefined,
      frameNumber: 0,
      totalFrames: 1,
      completed: false,
      canceled: false
    };
  }

  componentDidMount() {
    fetch(address+'/currentproject').then(res => {
      if (res.ok) {
        res.json().then(json => {
          this.state.project = json.project;
        })
      }
      else {
        console.error(`GET /currentproject at TranscodePNGPage: ${res.status} ${res.statusText}`);
      }
    })
    fetch(address+'/nextframe').then(res => {
    	if (res.ok) {
        res.json().then(json => {
          this.state.totalFrames = json.numFrames;
        })
      }
      else {
        console.error(`GET /nextframe at TranscodePNGPage: ${res.status} ${res.statusText}`);
      }
    })
    document.body.classList.toggle("transcodepng-page");
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
    if (this.state.frameNumber !== prevState.frameNumber) {
      fetch(address+'/nextframe').then(res => {
      	if (res.ok) {
          res.json().then(json => {
            if (json.frameNumber >= 0) {
              this.state.framenumber = json.framenumber;
            }
            else {
              // All transcoding jobs have finished.
              this.state.completed = true;
            }
          })
        }
      })
    }
  }

  displayIncomplete() {
    return (
      <>
        <h1>Transcoding {this.state.project} JPGs</h1>
        <div>
          <h3>Extracting PNG frames, please wait...</h3>
          <Progress animated value={this.state.frameNumber/this.state.totalFrames} />
        </div>
        <Link to="/">
          <Button id="cancelTooltip" color="primary" onclick={"this.state.canceled = true;"}>Cancel</Button>
        </Link>
      </>
    );
  }

  displayComplete() {
    return (
      <>
        <h1>Transcoding {this.state.project} JPGs</h1>
        <div>
          <h3>All PNG frames extracted</h3>
          <Progress animated value={100} />
          <Checkmark size='xxLarge' />
        </div>
        <Link to="/">
          <Buttoncolor="primary">OK</Button>
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

export default TranscodePNGPage;
