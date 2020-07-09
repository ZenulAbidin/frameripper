import React from "react";
import {Link} from "react-router-dom";
import {Form, FormGroup, FormFeedback, Button, Col, Input, Label, Tooltip} from "reactstrap";
import "../assets/css/styles.css";
import {wwwencode_partial, wwwencode_form, wwwdecode} from "../Utils";
import APIServer from "../components/APIServer";
import Header from "../components/Header";

var address = localStorage.getItem('serverAddress') || '';


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
      offset: -1,
      prefixInputInvalid: false,
      pathInputInvalid: false,
      projects: []
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

  componentDidMount() {
    document.body.classList.toggle("newproject-page");
    fetch(address+'/projects').then(res => {
      if (res.ok) {
        res.json().then(json => {
          this.setState({
            projects: wwwdecode(json.projects)
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
    var body = {'projects': wwwencode_partial(this.state.projects.concat(this.state.path))};
    // send POST request
    fetch(address+'/projects', {
        method: 'post',
        body:    wwwencode_form(body),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }).then(res => {
    	if (!res.ok) {
        console.error(`POST /projects with body ${JSON.stringify(body)} at NewProjectPage: ${res.status} ${res.statusText}`);
      }
    });
    body = {'currentProject': wwwencode_partial(this.state.path)};
    // send POST request
    fetch(address+'/currentproject', {
        method: 'post',
        body:   wwwencode_form(body),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }).then(res => {
    	if (!res.ok) {
        console.error(`POST /currentproject with body ${JSON.stringify(body)} at NewProjectPage: ${res.status} ${res.statusText}`);
      }
    });
    setTimeout(() => {
      body = {'prefix': wwwencode_partial(this.state.prefix), 'frameOffset': wwwencode_partial(this.state.offset)};
      // send POST request
      fetch(address+'/currentsettings', {
          method: 'post',
          body:    wwwencode_form(body),
          headers: {'Content-Type': 'application/x-www-form-urlencoded' },
      }).then(res => {
      	if (!res.ok) {
          console.error(`POST /currentsettings with body ${JSON.stringify(body)} at NewProjectPage: ${res.status} ${res.statusText}`);
        }
      });
      // convert arbitrary JSON arrays into strings first and then to base64.
      body = {'framesList': wwwencode_partial([])};
      // send POST request
      fetch(address+'/frameslist', {
          method: 'post',
          body:    wwwencode_form(body),
          headers: {'Content-Type': 'application/x-www-form-urlencoded' },
      }).then(res => {
      	if (!res.ok) {
          console.error(`POST /frameslist with body ${JSON.stringify(body)} at NewProjectPage: ${res.status} ${res.statusText}`);
        }
      });
      body = {'numFrames': wwwencode_partial(0)};
      // send POST request
      fetch(address+'/numframes', {
          method: 'post',
          body:    wwwencode_form(body),
          headers: {'Content-Type': 'application/x-www-form-urlencoded' },
      }).then(res => {
      	if (!res.ok) {
          console.error(`POST /numframes with body ${JSON.stringify(body)} at NewProjectPage: ${res.status} ${res.statusText}`);
        }
      });
    }, 500);
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
        <h3 className='content_banner'>New Project</h3>
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
                <Input min={-10} max={10} id="offsetInput" type="number" step="1" placeholder="-1" onChange={e => this.setState({frameOffset: e.target.value})}/>
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
        <Header></Header>
        { address === "" ? null : this.content() }
        <APIServer></APIServer>
      </>
    );
  }
}

export default NewProjectPage;
