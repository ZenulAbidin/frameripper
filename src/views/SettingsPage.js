import React from "react";
import {Link} from "react-router-dom";
import {Form, FormGroup, FormFeedback, Button, Col, Input, Label, Tooltip} from "reactstrap";
import "../assets/css/styles.css";
import {wwwencode_partial, wwwencode_form, wwwdecode} from "../Utils";
import APIServer from "../components/APIServer";
import Header from "../components/Header";

var address = localStorage.getItem('serverAddress') || '';

class SettingsPage extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      prefixTooltipOpen: false,
      offsetTooltipOpen: false,
      saveTooltipOpen: false,
      prefix: "",
      frameOffset: -1,
      project: null,
      prefixInputInvalid: false
    };

    this.togglePrefixTooltipOpen = this.togglePrefixTooltipOpen.bind(this);
    this.toggleOffsetTooltipOpen = this.toggleOffsetTooltipOpen.bind(this);
    this.toggleSaveTooltipOpen = this.toggleSaveTooltipOpen.bind(this);
    this.validatePrefixInput = this.validatePrefixInput.bind(this);
    this.prefixHelpText = this.prefixHelpText.bind(this);
    this.sendOKRequest = this.sendOKRequest.bind(this);
    this.content = this.content.bind(this);
  }

  componentDidMount() {
    document.body.classList.toggle("settings-page");
    fetch(address+'/currentproject').then(res => {
      if (res.ok) {
        res.json().then(json => {
          this.setState({
            project: wwwdecode(json.currentProject)
          });
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
        <h3 className='content_banner'>Settings for {this.state.project}</h3>
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
                <Input min={-10} max={10} id="offsetInput" type="number" step="1" placeholder="-1" onChange={e => this.setState({frameOffset: e.target.value})}/>
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
        <Header></Header>
        { address === "" ? null : this.content() }
        <APIServer></APIServer>
      </>
    );
  }
}

export default SettingsPage;
