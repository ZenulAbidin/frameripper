import React from "react";
import {Checkmark} from 'react-checkmark';
import {Link} from "react-router-dom";
import {Spinner, Button} from "reactstrap";
import "../assets/css/styles.css";
import {wwwdecode} from "../Utils";
import APIServer from "../components/APIServer";
import Header from "../components/Header";

var address = localStorage.getItem('serverAddress') || '';

class TranscodeJPGPage extends React.Component {
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
    document.body.classList.toggle("transcodejpg-page");
    fetch(address+'/currentproject').then(res => {
      if (res.ok) {
        res.json().then(json => {
          this.setState({
            project: wwwdecode(json.currentProject)
          });
        })
      }
      else {
        console.error(`GET /currentproject at TranscodeJPGPage: ${res.status} ${res.statusText}`);
      }
    })
    this.interval = setInterval(this.queryComplete, 1000);
  }

  queryComplete() {
    fetch(address+'/istranscodingjpgcomplete').then(res => {
    	if (res.ok) {
        res.json().then(json => {
          if (wwwdecode(json.complete) === true) {
            this.setState({
              completed: true,
            });
            clearInterval(this.interval);
          }
        })
      }
      else {
        console.error(`GET /istranscodingjpgcomplete at TranscodeJPGPage: ${res.status} ${res.statusText}`);
        this.setState({
          failed: true
        });
        clearInterval(this.interval);
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
    clearInterval(this.interval);
    document.body.classList.toggle("transcodejpg-page");
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
        <div className='centered height_50'>
          <h1 className='content_banner'>Transcoding {this.state.project} JPGs</h1>
          <div style={{ alignSelf: "center", width: '6rem', height: '6rem' }}>
            <Spinner style={{ width: '96px', height: '96px' }} type="grow" color="info" />
          </div>
            <h3>Extracting JPG frames, please wait...</h3>
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
          <h1 className='content_banner'>Transcoding {this.state.project} JPGs</h1>
          <Checkmark size='xxLarge' />
          <h3>All JPG frames extracted</h3>
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
          <h1 className='content_banner'>Transcoding {this.state.project} JPGs</h1>
          <h3 className='content_banner'>There was an error in ffmpeg. Check the server logs for more information.</h3>
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

export default TranscodeJPGPage;
