import React from "react";
import {Link} from "react-router-dom";
import {Form, FormGroup, Button, Col, Input, Label, Tooltip} from "reactstrap";
import "../assets/css/styles.css";

var process = require('process');

const address = process.env.SERVER_ADDRESS;


class NewProjectPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      pathTooltipOpen: false,
      prefixTooltipOpen: false,
      offsetTooltipOpen: false,
      runFFmpegTooltipOpen: false,
      createTooltipOpen: false,
      path: "",
      prefix: "",
      offset: null,
      prefixInputInvalid: false,
      pathInputInvalid: false,
      canceled: false
    };
  }

  togglePathTooltipOpen() {
    this.setState({
      pathTooltipOpen: !this.state.pathTooltipOpen
    });
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
  toggleRunFFmpegTooltipOpen() {
    this.setState({
     runFFmpegTooltipOpen: !this.state.runFFmpegTooltipOpen
    });
  }
  toggleCreateTooltipOpen() {
    this.setState({
     createTooltipOpen: !this.state.createTooltipOpen
    });
  }


  componentDidMount() {
    document.body.classList.toggle("newproject-page");
  }
  componentWillUnmount() {
    if (!this.state.canceled) {
      var body = {'project': this.state.path};
      // send PUT request
      fetch(address+'/currentproject', {
          method: 'put',
          body:    JSON.stringify(body),
          headers: { 'Content-Type': 'application/json' },
      }).then(res => {
      	if (!res.ok) {
          console.error(`PUT /currentproject with body ${JSON.stringify(body)} at NewProjectPage: ${res.status} ${res.statusText}`);
        }
      });
      body = {'prefix': this.state.prefix, 'frameOffset': this.state.frameOffset};
      // send PUT request
      fetch(address+'/currentsettings', {
          method: 'put',
          body:    JSON.stringify(body),
          headers: { 'Content-Type': 'application/json' },
      }).then(res => {
      	if (!res.ok) {
          console.error(`PUT /currentsettings with body ${JSON.stringify(body)} at NewProjectPage: ${res.status} ${res.statusText}`);
        }
      });
      fetch(address+'/startjpgtranscode').then(res => {
        if (!res.ok) {
          console.error(`GET /startjpgtranscode at NewProjectPage: ${res.status} ${res.statusText}`);
        }
      });
    }
    document.body.classList.toggle("newproject-page");
  }


  validatePrefixInput(e) {
    if (e.target.value.length === 0) {
      this.setState({
        prefixInputInvalid: true
      });
    }
    for (var i = 0; i <  e.target.value.length; i++) {
      var c = e.target.value[i];
      if (!c.match('[0-9a-zA-Z]') && c !== '_' && c !== '-' && c !== '.' ) {
        this.state.prefixInputInvalid = true;
        break;
      }
    }
    this.setState({
      prefix: e.target.value,
      prefixInputInvalid: true
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

  validatePathInput(e) {
    if (e.target.value.length === 0) {
      this.setState({
        pathInputInvalid: true
      });
    }
    for (var i = 0; i <  e.target.value.length; i++) {
      var c = e.target.value[i];
      if (!c.match('[0-9a-zA-Z]') && c !== '_' && c !== '-' && c !== '.' ) {
        this.state.pathInputInvalid = true;
        break;
      }
    }
    this.setState({
      path: e.target.value,
      pathInputInvalid: true
    });
  }

  pathHelpText() {
    return (
      <>
        <span className="small invalid_text">Please ensure your file name contains only {'".", "-", "_"'} and{' '}
          alphanumeric characters and is not empty.
        </span>
      </>
    );
  }


  render() {
    return (
      <>
        <h1>New Project</h1>
        <div>
          <Form>
            <FormGroup row>
              <Label id="pathToolTip" for="pathInput" sm={2}>File Name</Label>
              <Col sm={10}>
                <Input type="text" id="pathInput" placeholder="video.mp4" onchange={e => this.validatePathInput(e)} className={(this.state.pathInputInvalid ? 'input_invalid' : null)} />
                (this.state.pathInputInvalid ? this.pathHelpText() : null)
              </Col>
            </FormGroup>
            <FormGroup row>
              <Label id="prefixToolTip" for="prefixInput" sm={2}>Prefix</Label>
              <Col sm={10}>
                <Input type="text" id="prefixInput" placeholder="Big_Buck_Bunny_" onchange={e => this.validatePrefixInput(e)} className={(this.state.prefixInputInvalid ? 'input_invalid' : null)} />
                (this.state.prefixInputInvalid ? this.prefixHelpText() : null)
              </Col>
            </FormGroup>
            <FormGroup row>
              <Label id="offsetToolTip" for="offsetInput">Frame offset</Label>
              <Col sm={10}>
                <Input min={-10} max={10} id="offsetInput" type="number" step="1" placeholder="-2"/>
              </Col>
            </FormGroup>
            <FormGroup row>
              <Label id="runFFmpegToolTip" for="ffmpegInput">Do not run ffmpeg</Label>
              <Col sm={10}>
                <Input id="ffmpegInput" type="checkbox"/>
              </Col>
            </FormGroup>
          </Form>
        </div>
        <div>
          <Link to="/transcode-jpg">
            <Button id="createTooltip" color="primary">Create</Button>
          </Link>
          <Link to="/">
            <Button color="primary" onclick={this.state.canceled = true}>Cancel</Button>
          </Link>
        </div>
        <Tooltip placement="left" isOpen={this.state.pathTooltipOpen} target="pathTooltip" toggle={this.togglePathTooltipOpen}>
          Full path to the video.
        </Tooltip>
        <Tooltip placement="left" isOpen={this.state.prefixTooltipOpen} target="prefixTooltip" toggle={this.togglePrefixTooltipOpen}>
          The text to put at the beginning of each file name. The rest of the filename is the frame number counting from 0.
        </Tooltip>
        <Tooltip placement="left" isOpen={this.state.offsetTooltipOpen} target="offsetTooltip" toggle={this.toggleOffsetTooltipOpen}>
          The change in frame number to pass to ffmpeg. Some videos do not have the frames of the stream counting from 0.
        </Tooltip>
        <Tooltip placement="left" isOpen={this.state.runFFmpegTooltipOpen} target="runFFmpegTooltip" toggle={this.toggleRunFFmpegTooltipOpen}>
          Do not run ffmpeg. Useful for recreating the database if it got corrupted.
        </Tooltip>
        <Tooltip placement="bottom" isOpen={this.state.createTooltipOpen} target="createTooltip" toggle={this.toggleCreateTooltip}>
          Begin extracting all frames from the video.
        </Tooltip>
      </>
    );
  }
}

export default NewProjectPage;
