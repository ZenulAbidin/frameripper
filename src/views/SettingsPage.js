import React from "react";
import {Link} from "react-router-dom";
import {Form, FormGroup, FormFeedback, Button, Col, Input, Label, Tooltip} from "reactstrap";
import "../assets/css/styles.css";
import {wwwencode_partial, wwwencode_form, wwwdecode} from "../Utils";

var address = localStorage.getItem('serverAddress') || '';

class SettingsPage extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      prefixTooltipOpen: false,
      offsetTooltipOpen: false,
      saveTooltipOpen: false,
      addressTooltipOpen: false,
      prefix: "",
      frameOffset: -2,
      project: null,
      prefixInputInvalid: false,
      serverAddress: ""
    };

    this.togglePrefixTooltipOpen = this.togglePrefixTooltipOpen.bind(this);
    this.toggleOffsetTooltipOpen = this.toggleOffsetTooltipOpen.bind(this);
    this.toggleSaveTooltipOpen = this.toggleSaveTooltipOpen.bind(this);
    this.toggleAddressTooltipOpen = this.toggleAddressTooltipOpen.bind(this);
    this.validatePrefixInput = this.validatePrefixInput.bind(this);
    this.prefixHelpText = this.prefixHelpText.bind(this);
    this.sendOKRequest = this.sendOKRequest.bind(this);
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
    document.body.classList.toggle("settings-page");
    fetch(address+'/currentproject').then(res => {
      if (res.ok) {
        res.json().then(json => {
          this.setState({
            project: wwwdecode(json.currentProject)
          });
          console.log(wwwdecode(json.currentProject))
        })
      }
      else {
        console.error(`GET /currentproject at SettingsPage: ${res.status} ${res.statusText}`);
      }
    })
    fetch(address+'/currentsettings').then(res => {
    	if (res.ok) {
        res.json().then(json => {
          this.setState({
            prefix: wwwdecode(json.prefix),
            frameOffset: wwwdecode(json.frameOffset),
          });
        })
      }
    })
  }
  componentWillUnmount() {
    document.body.classList.toggle("settings-page");
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

  sendOKRequest() {
    var body = {'prefix': wwwencode_partial(this.state.prefix), 'frameOffset': wwwencode_partial(this.state.frameOffset)};
    // send POST request
    fetch(address+'/currentsettings', {
        method: 'post',
        body:    wwwencode_form(body),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }).then(res => {
    	if (!res.ok) {
        console.error(`POST /currentsettings with body ${JSON.stringify(body)} at SettingsPage: ${res.status} ${res.statusText}`);
      }
    })
  }

  togglePrefixTooltipOpen() {
    this.setState({
      prefixTooltipOpen: !this.state.prefixTooltipOpen
    });
  }
  toggleOffsetTooltipOpen() {
    this.setState({
      offsetTooltipOpen: !this.state.offsetTooltipOpen
    });
  }
  toggleSaveTooltipOpen() {
    this.setState({
      saveTooltipOpen: !this.state.saveTooltipOpen
    });
  }

  validatePrefixInput(e) {
    if (e.target.value.length === 0) {
      this.setState({
        prefixInputInvalid: true
      });
      return;
    }
    for (var i = 0; i <  e.target.value.length; i++) {
      var c = e.target.value[i];
      if (!c.match('[0-9a-zA-Z]') && c !== '_' && c !== '-' && c !== '.' ) {
        this.setState({
          prefixInputInvalid: true
        });
        return;
      }
    }
    this.setState({
      prefix: e.target.value,
      prefixInputInvalid: false
    });
  }

  prefixHelpText() {
    return (
      <>
        <FormFeedback>Please ensure your prefix contains only {'".", "-", "_"'} and{' '}
          alphanumeric characters and is not empty.
        </FormFeedback>
      </>
    );
  }

  setCancelled() {
    this.setState({
     cancelled: true
    });
  }

  content() {
    return (
      <>
        <h3 style={{textAlign: 'center'}}>Settings for {this.state.project}</h3>
        <div style={{marginLeft: '1rem'}}>
          <Form>
            <FormGroup row>
              <Label id="prefixTooltip" for="prefixInput" sm={2}>Prefix</Label>
              <Col sm={6}>
                <Input type="text" id="prefixInput" placeholder="Big_Buck_Bunny_" onChange={e => this.validatePrefixInput(e)} invalid={this.state.prefixInputInvalid ? true : false} />
                {this.state.prefixInputInvalid ? this.prefixHelpText() : null}
              </Col>
            </FormGroup>
            <FormGroup row>
              <Label id="offsetTooltip" for="offsetInput" sm={2}>Frame offset</Label>
              <Col sm={2} md={1}>
                <Input min={-10} max={10} id="offsetInput" type="number" step="1" placeholder="-2" onChange={e => this.setState({frameOffset: e.target.value})}/>
              </Col>
            </FormGroup>
          </Form>
          <div className='container'>
            <div className='centered-horz'>
              <Link to="/select" className='container__child'>
                <Button id="saveTooltip" color="primary" disabled={this.state.prefixInputInvalid} onClick={this.sendOKRequest}>Save</Button>
              </Link>
              <Link to="/select" className='container__child'>
                <Button color="primary">Cancel</Button>
              </Link>
            </div>
          </div>
        </div>
        <Tooltip placement="left" isOpen={this.state.prefixTooltipOpen} target="prefixTooltip" toggle={this.togglePrefixTooltipOpen}>
          The text to put at the beginning of each file name. The rest of the filename is the frame number counting from 0.
        </Tooltip>
        <Tooltip placement="left" isOpen={this.state.offsetTooltipOpen} target="offsetTooltip" toggle={this.toggleOffsetTooltipOpen}>
          The change in frame number to pass to ffmpeg. Some videos do not have the frames of the stream counting from 0.
        </Tooltip>
        <Tooltip placement="bottom" isOpen={this.state.saveTooltipOpen} target="saveTooltip" toggle={this.toggleSaveTooltipOpen}>
          Save the settings.
        </Tooltip>
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
                <Label for="serverAddress" id="addressTooltip">API server address</Label>
                <Input type="text" id="serverAddress" onChange={e => this.setServerAddress(e)} onKeyPress={(t) => {if (t.charCode===13) {this.commitServerAddress()}}}
                    value={this.state.serverAddress}/>
                 <Button color="primary" onClick={this.commitServerAddress}>Save address</Button>
              </FormGroup>
            </Form>
          </div>
        </div>
        <Tooltip placement="bottom" isOpen={this.state.addressTooltipOpen} target="addressTooltip" toggle={this.toggleAddressTooltipOpen}>
          Sets the address of the API server to send queries to. It can be an IP address or a domain name and a path. port number can also be specified. Prepend {'http://'} or {'https://'} to it and don&apos;t end it with a slash.
        </Tooltip>
      </>
    );
  }
}

export default SettingsPage;
