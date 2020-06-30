import React from "react";
import {Checkmark} from 'react-checkmark';
import {Link} from "react-router-dom";
import {Spinner, Button} from "reactstrap";
import "../assets/css/styles.css";

const address = "http://iamomegastorm.tk:3030";

class TranscodeJPGPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      project: null,
      completed: false,
    };

    this.displayIncomplete = this.displayIncomplete.bind(this);
    this.displayComplete = this.displayComplete.bind(this);
    this.queryComplete = this.queryComplete.bind(this);
  }

  componentDidMount() {
    document.body.classList.toggle("transcodejpg-page");
    fetch(address+'/currentproject').then(res => {
      if (res.ok) {
        res.json().then(json => {
          this.setState({
            project: json.currentProject
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
          if (json.complete === true) {
            this.setState({
              completed: true
            });
            clearInterval(this.interval);
          }
        })
      }
      else {
        console.error(`GET /istranscodingjpgcomplete at TranscodeJPGPage: ${res.status} ${res.statusText}`);
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
          <h1>Transcoding {this.state.project} JPGs</h1>
          <div style={{ alignSelf: "center", width: '6rem', height: '6rem' }}>
            <Spinner style={{ width: '96px', height: '96px' }} type="grow" color="info" />
          </div>
            <h3>Extracting JPG frames, please wait...</h3>
          <Link to="/">
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
          <h1 style={{textAlign: 'center'}}>Transcoding {this.state.project} JPGs</h1>
          <Checkmark size='xxLarge' />
          <h3>All JPG frames extracted</h3>
          <Link to="/select">
            <Button color="primary">OK</Button>
          </Link>
        </div>
      </>
    );
  }

  render() {
    return (
      <>
        <h1 className='title'>Frameripper by Zenul_Abidin</h1>
        {this.state.completed ? this.displayComplete() : this.displayIncomplete()}
      </>
    );
  }
}

export default TranscodeJPGPage;
