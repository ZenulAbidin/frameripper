import React from "react";
import {Checkmark} from 'react-checkmark';
import {Link} from "react-router-dom";
import {Spinner, Button} from "reactstrap";
import "../assets/css/styles.css";
import {wwwdecode} from "../Utils";
import APIServer from "../components/APIServer";
import Header from "../components/Header";

const address = "http://iamomegastorm.tk:3030";

class TranscodePNGPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      project: null,
      completed: false,
      interval: null,
      failed: false
    };

    this.displayIncomplete = this.displayIncomplete.bind(this);
    this.displayComplete = this.displayComplete.bind(this);
    this.queryComplete = this.queryComplete.bind(this);
    this.content = this.content.bind(this);
  }

  componentDidMount() {
    document.body.classList.toggle("transcodepng-page");
    fetch(address+'/currentproject').then(res => {
      if (res.ok) {
        res.json().then(json => {
          this.setState({
            project: wwwdecode(json.currentProject)
          });
        })
      }
      else {
        console.error(`GET /currentproject at TranscodePNGPage: ${res.status} ${res.statusText}`);
      }
    })
    this.interval = setInterval(this.queryComplete, 1000);
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
          if (json.error) {
            this.setState({
              failed: true
            });
          }
          else if (wwwdecode(json.complete) === true) {
            this.setState({
              completed: true,
            });
          }
          clearInterval(this.interval);
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
        <div className='centered height_50'>
          <h1 style={{marginLeft: '1rem', marginRight: '1rem', textAlign: 'center'}}>Transcoding {this.state.project} PNGs</h1>
          <div style={{ alignSelf: "center", width: '6rem', height: '6rem' }}>
            <Spinner style={{ width: '96px', height: '96px' }} type="grow" color="info" />
          </div>
            <h3>Extracting PNG frames, please wait...</h3>
          <Link to="/select">
            <Button color="primary" onClick={this.abortTranscode}>Cancel</Button>
          </Link>
        </div>
      </>
    );
  }

  displayComplete() {
    return (
      <>
        <div className='centered height_50'>
          <h1 style={{textAlign: 'center'}}>Transcoding {this.state.project} PNGs</h1>
          <Checkmark size='xxLarge' />
          <h3>All PNG frames extracted</h3>
          <Link to="/select">
            <Button color="primary">OK</Button>
          </Link>
        </div>
      </>
    );
  }

  displayFailed() {
    return (
      <>
        <div className='centered height_50'>
          <h1 style={{textAlign: 'center'}}>Transcoding {this.state.project} PNGs</h1>
          <h3>There was an error in ffmpeg. Check the server logs for more information.</h3>
          <Link to="/select">
            <Button color="primary">OK</Button>
          </Link>
        </div>
      </>
    );
  }

  content() {
    return (
      <>
        {this.state.failed ? this.displayFailed() : (this.state.completed ? this.displayComplete() : this.displayIncomplete())}
      </>
    );
  }

  render() {
    return (
      <>
        <Header></Header>
        { address === "" ? null : this.content() }
        <APIServer></APIServer>
      </>
    );
  }
}

export default TranscodePNGPage;
