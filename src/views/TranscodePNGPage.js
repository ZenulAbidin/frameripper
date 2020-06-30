import React from "react";
import {Checkmark} from 'react-checkmark';
import {Link} from "react-router-dom";
import {Spinner, Button} from "reactstrap";
import "../assets/css/styles.css";

const address = "http://iamomegastorm.tk:3030";

class TranscodePNGPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      project: null,
      completed: false,
      interval: null,
    };

    this.displayIncomplete = this.displayIncomplete.bind(this);
    this.displayComplete = this.displayComplete.bind(this);
    this.queryComplete = this.queryComplete.bind(this);
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
    this.interval = setInterval(this.queryComplete, 500);
  }

  componentWillUnmount() {
    if (this.state.cancelled) {
      fetch(address+'/abortpngtranscode').then(res => {
        if (!res.ok) {
          console.error(`GET /abortpngtranscode at TranscodePNGPage: ${res.status} ${res.statusText}`);
        }
      });
    }
    clearInterval(this.interval);
    document.body.classList.toggle("transcodepng-page");
  }

  queryComplete() {
    fetch(address+'/istranscodingpngcomplete').then(res => {
    	if (res.ok) {
        res.json().then(json => {
          if (json.complete === true) {
            this.setState({
              completed: true,
            });
            clearInterval(this.interval);
          }
        })
      }
      else {
        console.error(`GET /istranscodingpngcomplete at TranscodePNGPage: ${res.status} ${res.statusText}`);
      }
    });
  }

  abortTranscode() {
    fetch(address+'/abortpngtranscode').then(res => {
      if (!res.ok) {
        console.error(`GET /abortpngtranscode at NewProjectPage: ${res.status} ${res.statusText}`);
      }
    });
  }

  displayIncomplete() {
    return (
      <>
        <h1 style={{textAlign: 'center'}}>Transcoding {this.state.project} PNGs</h1>
        <div>
          <div style={{ alignSelf: "center", width: '6rem', height: '6rem' }}>
            <Spinner type="grow" color="info" />
          </div>
          <h3>Extracting PNG frames, please wait...</h3>
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
        <h1 style={{textAlign: 'center'}}>Transcoding {this.state.project} PNGs</h1>
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

  render() {
    return (
      <>
        <div style={{marginLeft: '10px', marginTop: '10px'}}>
          <h1 style={{textAlign: 'center'}}>Frameripper by Zenul_Abidin</h1>
          {this.state.completed ? this.displayComplete() : this.displayIncomplete()}
        </div>
      </>
    );
  }
}

export default TranscodePNGPage;
