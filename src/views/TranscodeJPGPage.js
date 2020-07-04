import React from "react";
import {Checkmark} from 'react-checkmark';
import {Link} from "react-router-dom";
import {Spinner, Button, Form, FormGroup, Label, Input} from "reactstrap";
import "../assets/css/styles.css";

var address = localStorage.getItem('serverAddress') || '';

class TranscodeJPGPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      addressTooltipOpen: false,
      project: null,
      completed: false,
      serverAddress: ""
    };

    this.displayIncomplete = this.displayIncomplete.bind(this);
    this.displayComplete = this.displayComplete.bind(this);
    this.queryComplete = this.queryComplete.bind(this);
    this.setServerAddress = this.setServerAddress.bind(this);
    this.commitServerAddress = this.commitServerAddress.bind(this);
    this.content = this.content.bind(this);
  }

  toggleAddressTooltipOpen() {
    this.setState({
      addressTooltipOpen: !this.state.addressTooltipOpen
    });
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
  
  setServerAddress(e) {
    this.setState({
      serverAddress: e.target.value
    })
  }

  commitServerAddress() {
    localStorage.setItem('serverAddress', this.state.serverAddress);
    window.location.reload(false);
  }

  displayServerAddress() {
    return (
      <>
        <h5 style={{textAlign: 'center'}}>Using API server &quot;{address}&quot;</h5>
      </>
    )
  }

  displayNoAddressHint() {
    return (
      <>
        <h5 style={{textAlign: 'center'}}>Please enter an API server address.</h5>
      </>
    )
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

  content() {
    return (
      <>
        {this.state.completed ? this.displayComplete() : this.displayIncomplete()}
      </>
    );
  }

  render() {
    return (
      <>
        <h1 className='title'>Frameripper by Zenul_Abidin</h1>
        { address === "" ? this.displayNoAddressHint() : this.displayServerAddress() }
        { address === "" ? null : this.content() }
        <div className='container'>
          <div className='centered-horz'>
            <Form>
              <FormGroup row style={{marginRight: '1rem'}}>
                <Label for="serverAddress" id="saveTooltip">API server address</Label>
                <Input type="text" id="serverAddress" onChange={e => this.setServerAddress(e)} onKeyPress={(t) => {if (t.charCode===13) {this.commitServerAddress()}}}
                    value={this.state.serverAddress}/>
                 <Button id="saveTooltip" color="primary" onClick={this.commitServerAddress}>Save address</Button>
              </FormGroup>
            </Form>
          </div>
        </div>
      </>
    );
  }
}

export default TranscodeJPGPage;
