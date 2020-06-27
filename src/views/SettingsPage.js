import React from "react";
import {Link} from "react-router-dom";
import {Form, FormGroup, Button, Col, Input, Label, Tooltip} from "reactstrap";
import "../assets/css/styles.css";

var process = require('process');

const address = "http://iamomegastorm.tk:3030";

class SettingsPage extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      prefixTooltipOpen: false,
      offsetTooltipOpen: false,
      saveTooltipOpen: false,
      prefix: "",
      frameOffset: null,
      project: null,
      prefixInputInvalid: false,
    };

    this.togglePrefixTooltipOpen = this.togglePrefixTooltipOpen.bind(this);
    this.toggleOffsetTooltipOpen = this.toggleOffsetTooltipOpen.bind(this);
    this.toggleSaveTooltipOpen = this.toggleSaveTooltipOpen.bind(this);
    this.validatePrefixInput = this.validatePrefixInput.bind(this);
    this.prefixHelpText = this.prefixHelpText.bind(this);
    this.sendOKRequest = this.sendOKRequest.bind(this);
  }

  componentDidMount() {
    document.body.classList.toggle("settings-page");
    fetch(address+'/currentproject').then(res => {
      if (res.ok) {
        res.json().then(json => {
          this.setState({
            project: json.project
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
            prefix: json.prefix,
            frameOffset: json.frameOffset,
          });
        })
      }
    })
  }
  componentWillUnmount() {
    document.body.classList.toggle("settings-page");
  }

  sendOKRequest() {
    var body = {'prefix': this.state.prefix, 'frameOffset': this.state.frameOffset};
    // send PUT request
    fetch(address+'/currentsettings', {
        method: 'put',
        body:    JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
    }).then(res => {
    	if (!res.ok) {
        console.error(`PUT /currentsettings with body ${JSON.stringify(body)} at SettingsPage: ${res.status} ${res.statusText}`);
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
        <span className="small invalid_text">Please ensure your prefix contains only {'".", "-", "_"'} and{' '}
          alphanumeric characters and is not empty.
        </span>
      </>
    );
  }

  setCancelled() {
    this.setState({
     cancelled: true
    });
  }

  render() {
    return (
      <>
        <h1>Settings for {this.state.project}</h1>
        <div>
          <Form>
            <FormGroup row>
              <Label id="prefixTooltip" for="prefixInput" sm={2}>Prefix</Label>
              <Col sm={10}>
                <Input type="text" id="prefixInput" placeholder="Big_Buck_Bunny_" onchange={e => this.validatePrefixInput(e)} className={(this.state.prefixInputInvalid ? 'input_invalid' : null)} />
                (this.state.prefixInputInvalid ? this.prefixHelpText() : null)
              </Col>
            </FormGroup>
            <FormGroup row>
              <Label id="offsetTooltip" for="offsetInput">Frame offset</Label>
              <Col sm={10}>
                <Input min={-10} max={10} type="number" step="1" placeholder="-2" onchange={e => this.setState({frameOffset: e.target.value})} />
              </Col>
            </FormGroup>
          </Form>
          <Link to="/select">
            <Button id="createTooltip" color="primary" onClick={this.sendOKRequest()}>Save</Button>
          </Link>
          <Link to="/">
            <Button id="createTooltip" color="primary">Cancel</Button>
          </Link>
        </div>
        <Tooltip placement="left" isOpen={this.state.prefixTooltipOpen} target="prefixTooltip" toggle={this.togglePrefixTooltipOpen}>
          The text to put at the beginning of each file name. The rest of the filename is the frame number counting from 0.
        </Tooltip>
        <Tooltip placement="left" isOpen={this.state.offsetTooltipOpen} target="offsetTooltip" toggle={this.toggleOffsetTooltipOpen}>
          The change in frame number to pass to ffmpeg. Some videos do not have the frames of the stream counting from 0.
        </Tooltip>
        <Tooltip placement="bottom" isOpen={this.state.saveTooltipOpen} target="saveTooltip" toggle={this.toggleSaveTooltip}>
          Save the settings.
        </Tooltip>
      </>
    );
  }
}

export default SettingsPage;
