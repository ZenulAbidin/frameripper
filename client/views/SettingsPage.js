
import React from "react";
var process = require('process');
import {Form, FormGroup, Button, Col, Input, Label, Link, Tooltip} from "reactstrap";

const address = process.env.SERVER_ADDRESS;

class SettingsPage extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      prefixTooltipOpen: false,
      offsetTooltipOpen: false,
      saveTooltipOpen: false,
      prefix: undefined,
      frameOffset: undefined,
      project: undefined,
      canceled: false
    };
  }

  componentDidMount() {
    document.body.classList.toggle("settings-page");
    fetch(address+'/currentproject').then(res => {
      if (res.ok) {
        res.json().then(json => {
          this.state.project = json.project;
        })
      }
      else {
        console.error(`GET /currentproject at SettingsPage: ${res.status} ${res.statusText}`);
      }
    })
    fetch(address+'/currentsettings').then(res => {
    	if (res.ok) {
        res.json().then(json => {
          this.state.prefix = json.prefix;
          this.state.frameOffset = json.frameOffset;
        })
      }
    })
  }
  componentWillUnmount() {
    if (!this.state.canceled) {
      body = {'prefix': prefix, 'frameOffset': frameOffset};
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
    document.body.classList.toggle("settings-page");
  }

  togglePrefixTooltipOpen() {
    this.setState({prefixTooltipOpen: !prefixTooltipOpen});
  }
  toggleOffsetTooltipOpen() {
    this.setState({offsetTooltipOpen: !offsetTooltipOpen});
  }
  toggleSaveTooltipOpen() {
    this.setState({saveTooltipOpen: !saveTooltipOpen});
  }

  render() {
    return (
      <>
        <h1>Settings for {this.state.project}</h1>
        <div>
          <Form>
            <FormGroup row>
              <Label id="prefixToolTip" for="prefixInput" sm={2}>Prefix</Label>
              <Col sm={10}>
                <Input type="text" id="prefixInput" placeholder="Big_Buck_Bunny_" />
              </Col>
            </FormGroup>
            <FormGroup row>
              <Label id="offsetToolTip" for="offsetInput">Frame offset</Label>
              <Col sm={10}>
                <Input min={-10} max={10} type="number" step="1" placeholder="-2"/>
              </Col>
            </FormGroup>
          </Form>
          <Link to="/select">
            <Button id="createTooltip" color="primary">Save</Button>
          </Link>
          <Link to="/">
            <Button id="createTooltip" color="primary" onclick={() => {this.state.canceled = true;}>Cancel</Button>
          </Link>
        </div>
        <Tooltip placement="left" isOpen={this.state.prefixTooltipOpen} target="prefixTooltip" toggle={togglePrefixTooltipOpen}>
          The text to put at the beginning of each file name. The rest of the filename is the frame number counting from 0.
        </Tooltip>
        <Tooltip placement="left" isOpen={this.state.offsetTooltipOpen} target="offsetTooltip" toggle={toggleOffsetTooltipOpen}>
          The change in frame number to pass to ffmpeg. Some videos do not have the frames of the stream counting from 0.
        </Tooltip>
        <Tooltip placement="bottom" isOpen={this.state.saveTooltipOpen} target="saveTooltip" toggle={toggleSaveTooltip}>
          Save the settings.
        </Tooltip>
      </>
    );
  }
}

export default SettingsPage;
