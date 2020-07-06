import React from "react";
import {Link} from "react-router-dom";
import {Form, FormGroup, FormFeedback, Button, Col, Input, Label, Tooltip} from "reactstrap";
import "../assets/css/styles.css";
import {wwwencode_partial, wwwencode_form, wwwdecode} from "../Utils";

var address = localStorage.getItem('serverAddress') || '';


class NewProjectPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      pathTooltipOpen: false,
      prefixTooltipOpen: false,
      offsetTooltipOpen: false,
      createTooltipOpen: false,
      addressTooltipOpen: false,
      path: "",
      prefix: "",
      offset: -2,
      prefixInputInvalid: false,
      pathInputInvalid: false,
      projects: [],
      serverAddress: ""
    };

    this.toggleAddressTooltipOpen = this.toggleAddressTooltipOpen.bind(this);
    this.togglePathTooltipOpen = this.togglePathTooltipOpen.bind(this);
    this.togglePrefixTooltipOpen = this.togglePrefixTooltipOpen.bind(this);
    this.toggleOffsetTooltipOpen = this.toggleOffsetTooltipOpen.bind(this);
    this.toggleCreateTooltipOpen = this.toggleCreateTooltipOpen.bind(this);
    this.validatePrefixInput = this.validatePrefixInput.bind(this);
    this.prefixHelpText = this.prefixHelpText.bind(this);
    this.validatePathInput = this.validatePathInput.bind(this);
    this.pathHelpText = this.pathHelpText.bind(this);
    this.sendOKRequest = this.sendOKRequest.bind(this);
    this.setServerAddress = this.setServerAddress.bind(this);
    this.commitServerAddress = this.commitServerAddress.bind(this);
    this.content = this.content.bind(this);
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

  toggleAddressTooltipOpen() {
    this.setState({
      addressTooltipOpen: !this.state.addressTooltipOpen
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
    
    console.log(this.state.projects.concat(this.state.path)))
    var body = {'projects': wwwencode_partial(this.state.projects.concat(this.state.path))};
    var formBody = wwwencode_form(body);
    // send POST request
    fetch(address+'/projects', {
        method: 'post',
        body:    formBody,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }).then(res => {
    	if (!res.ok) {
        console.error(`POST /projects with body ${JSON.stringify(body)} at NewProjectPage: ${res.status} ${res.statusText}`);
      }
    });
    body = {'currentProject': wwwencode_partial(this.state.path)};
    formBody = wwwencode_form(body);
    // send POST request
    fetch(address+'/currentproject', {
        method: 'post',
        body:   formBody,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }).then(res => {
    	if (!res.ok) {
        console.error(`POST /currentproject with body ${JSON.stringify(body)} at NewProjectPage: ${res.status} ${res.statusText}`);
      }
    });
    body = {'prefix': wwwencode_partial(this.state.prefix), 'frameOffset': wwwencode_partial(this.state.offset)};
    formBody = wwwencode_form(body);
    // send POST request
    fetch(address+'/currentsettings', {
        method: 'post',
        body:    formBody,
        headers: {'Content-Type': 'application/x-www-form-urlencoded' },
    }).then(res => {
    	if (!res.ok) {
        console.error(`POST /currentsettings with body ${JSON.stringify(body)} at NewProjectPage: ${res.status} ${res.statusText}`);
      }
    });
    // convert arbitrary JSON arrays into strings first and then to base64.
    body = {'framesList': wwwencode_partial([])};
    formBody = wwwencode_form(body);
    // send POST request
    fetch(address+'/frameslist', {
        method: 'post',
        body:    formBody,
        headers: {'Content-Type': 'application/x-www-form-urlencoded' },
    }).then(res => {
    	if (!res.ok) {
        console.error(`POST /frameslist with body ${JSON.stringify(body)} at NewProjectPage: ${res.status} ${res.statusText}`);
      }
    });
    body = {'numFrames': wwwencode_partial(0)};
    formBody = wwwencode_form(body);
    // send POST request
    fetch(address+'/numframes', {
        method: 'post',
        body:    formBody,
        headers: {'Content-Type': 'application/x-www-form-urlencoded' },
    }).then(res => {
    	if (!res.ok) {
        console.error(`POST /numframes with body ${JSON.stringify(body)} at NewProjectPage: ${res.status} ${res.statusText}`);
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
        <FormFeedback>Please ensure your prefix contains only {'".", "-", "_"'} and{' '}
          alphanumeric characters and is not empty.
        </FormFeedback>
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
        <FormFeedback>Please ensure your file name is not empty.
        </FormFeedback>
      </>
    );
  }


  content() {
    return (
      <>
        <h3 style={{textAlign: 'center'}}>New Project</h3>
        <div style={{marginLeft: '1rem'}}>
          <Form>
            <FormGroup row>
              <Label id="pathTooltip" for="pathInput" sm={2}>File Name</Label>
              <Col sm={6}>
                <Input type="text" id="pathInput" placeholder="video.mp4" onChange={e => this.validatePathInput(e)} invalid={this.state.pathInputInvalid ? true : false} />
                {this.state.pathInputInvalid ? this.pathHelpText() : null}
              </Col>
            </FormGroup>
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
                <Button id="createTooltip" color="primary" disabled={this.state.prefixInputInvalid || this.state.pathInputInvalid} onClick={this.sendOKRequest}>Create</Button>
              </Link>
              <Link to="/" className='container__child'>
                <Button color="primary">Cancel</Button>
              </Link>
            </div>
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
        <Tooltip placement="bottom" isOpen={this.state.createTooltipOpen} target="createTooltip" toggle={this.toggleCreateTooltipOpen}>
          Create the project and go to the select frames page.
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

export default NewProjectPage;
