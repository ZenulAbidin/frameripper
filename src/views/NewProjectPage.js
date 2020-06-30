import React from "react";
import {Link} from "react-router-dom";
import {Form, FormGroup, Button, Col, Input, Label, Tooltip} from "reactstrap";
import "../assets/css/styles.css";

const address = "http://iamomegastorm.tk:3030";


class NewProjectPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      pathTooltipOpen: false,
      prefixTooltipOpen: false,
      offsetTooltipOpen: false,
      createTooltipOpen: false,
      path: "",
      prefix: "",
      offset: null,
      prefixInputInvalid: false,
      pathInputInvalid: false,
      projects: null
    };

    this.togglePathTooltipOpen = this.togglePathTooltipOpen.bind(this);
    this.togglePrefixTooltipOpen = this.togglePrefixTooltipOpen.bind(this);
    this.toggleOffsetTooltipOpen = this.toggleOffsetTooltipOpen.bind(this);
    this.toggleCreateTooltipOpen = this.toggleCreateTooltipOpen.bind(this);
    this.validatePrefixInput = this.validatePrefixInput.bind(this);
    this.prefixHelpText = this.prefixHelpText.bind(this);
    this.validatePathInput = this.validatePathInput.bind(this);
    this.pathHelpText = this.pathHelpText.bind(this);
    this.sendOKRequest = this.sendOKRequest.bind(this);
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
  toggleCreateTooltipOpen() {
    this.setState({
     createTooltipOpen: !this.state.createTooltipOpen
    });
  }

  componentDidMount() {
    document.body.classList.toggle("newproject-page");
    fetch(address+'/projects').then(res => {
      if (res.ok) {
        res.json().then(json => {
          this.setState({
            projects: json.projects
          });
        })
      }
      else {
        console.error(`GET /projects at NewProjectPage: ${res.status} ${res.statusText}`);
      }
    })
  }
  componentWillUnmount() {
    document.body.classList.toggle("newproject-page");
  }

  sendOKRequest() {
    
    var body = {'projects': this.state.projects.concat(this.state.path)};
    // send POST request
    fetch(address+'/projects', {
        method: 'post',
        body:    JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
    }).then(res => {
    	if (!res.ok) {
        console.error(`POST /projects with body ${JSON.stringify(body)} at NewProjectPage: ${res.status} ${res.statusText}`);
      }
    });
    body = {'currentProject': this.state.path};
    // send POST request
    fetch(address+'/currentproject', {
        method: 'post',
        body:    JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
    }).then(res => {
    	if (!res.ok) {
        console.error(`POST /currentproject with body ${JSON.stringify(body)} at NewProjectPage: ${res.status} ${res.statusText}`);
      }
    });
    body = {'settings': {'prefix': this.state.prefix, 'frameOffset': this.state.frameOffset}};
    // send POST request
    fetch(address+'/currentsettings', {
        method: 'post',
        body:    JSON.stringify(body),
        headers: {'Content-Type': 'application/json' },
    }).then(res => {
    	if (!res.ok) {
        console.error(`POST /currentsettings with body ${JSON.stringify(body)} at NewProjectPage: ${res.status} ${res.statusText}`);
      }
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

  validatePathInput(e) {
    if (e.target.value.length === 0) {
      this.setState({
        pathInputInvalid: true
      });
      return;
    }
    this.setState({
      path: e.target.value,
      pathInputInvalid: false
    });
  }

  pathHelpText() {
    return (
      <>
        <span className="small invalid_text">Please ensure your file name is not empty.
        </span>
      </>
    );
  }


  render() {
    return (
      <>
        <div style={{marginLeft: '10px', marginTop: '10px'}}>
          <h1 style={{textAlign: 'center'}}>Frameripper by Zenul_Abidin</h1>
          <h3 style={{textAlign: 'center'}}>New Project</h3>
          <div>
            <Form>
              <FormGroup row>
                <Label id="pathTooltip" for="pathInput" sm={2}>File Name</Label>
                <Col sm={6}>
                  <Input type="text" id="pathInput" placeholder="video.mp4" onChange={e => this.validatePathInput(e)} className={(this.state.pathInputInvalid ? 'input_invalid' : null)} />
                  {this.state.pathInputInvalid ? this.pathHelpText() : null}
                </Col>
              </FormGroup>
              <FormGroup row>
                <Label id="prefixTooltip" for="prefixInput" sm={2}>Prefix</Label>
                <Col sm={6}>
                  <Input type="text" id="prefixInput" placeholder="Big_Buck_Bunny_" onChange={e => this.validatePrefixInput(e)} className={(this.state.prefixInputInvalid ? 'input_invalid' : null)} />
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
          </div>
          <div>
            <Link to="/select">
              <Button id="createTooltip" color="primary" onClick={this.sendOKRequest}>Create</Button>
            </Link>
            <Link to="/">
              <Button color="primary">Cancel</Button>
            </Link>
          </div>
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
        <Tooltip placement="bottom" isOpen={this.state.createTooltipOpen} target="createTooltip" toggle={this.toggleCreateTooltip}>
          Go to the transcoding page
        </Tooltip>
      </>
    );
  }
}

export default NewProjectPage;
