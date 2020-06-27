import React from "react";
import "../assets/css/styles.css";
import {Link} from "react-router-dom";
import {Form, FormGroup, Button, Input, Label, Tooltip} from "reactstrap";

var process = require('process');

const address = "http://iamomegastorm.tk:3030";

class SelectPage extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      frameNumbersTooltipOpen: false,
      framesList: null,
      numFrames: null,
      project: null,
      inputFrameNumbers: "",
      frameNumbersInvalid: false,
      cancelled: true
    };

    this.toggleFrameNumbersTooltipOpen = this.toggleFrameNumbersTooltipOpen.bind(this);
    this.frameNumbersHelpText = this.frameNumbersHelpText.bind(this);
    this.validateFrameNumbersInput = this.validateFrameNumbersInput.bind(this);
    this.startJPGTranscode = this.startJPGTranscode.bind(this);
    this.startPNGTranscode = this.startPNGTranscode.bind(this);
    this.setCancelled = this.setCancelled.bind(this);
  }

  componentDidMount() {
    document.body.classList.toggle("select-page");
    fetch(address+'/currentproject').then(res => {
      if (res.ok) {
        res.json().then(json => {
          this.setState({
            project: json.project
          });
        })
      }
      else {
        console.error(`GET /currentproject at SelectPage: ${res.status} ${res.statusText}`);
      }
    })
    fetch(address+'/frameslist').then(res => {
      if (res.ok) {
        res.json().then(json => {
          this.setState({
            framesList: json.framesList.join('\n')
          });
        })
      }
      else {
        console.error(`GET /frameslist at SelectPage: ${res.status} ${res.statusText}`);
      }
    })
    document.body.classList.toggle("select-page");
    fetch(address+'/numframes').then(res => {
      if (res.ok) {
        res.json().then(json => {
          this.setState({
            numFrames: json.numFrames
          });
        })
      }
      else {
        console.error(`GET /numframes at SelectPage: ${res.status} ${res.statusText}`);
      }
    });
  }
  componentWillUnmount() {
    if (!this.state.cancelled) {
      var body = {'framesList': this.state.framesList.split('\n')};
      // send PUT request
      fetch(address+'/frameslist', {
          method: 'put',
          body:    JSON.stringify(body),
          headers: { 'Content-Type': 'application/json' },
      }).then(res => {
      	if (!res.ok) {
          console.error(`PUT /frameslist with body ${JSON.stringify(body)} at SelectPage: ${res.status} ${res.statusText}`);
        }
      });
      fetch(address+'/startpngtranscode').then(res => {
        if (!res.ok) {
          console.error(`GET /startpngtranscode at SelectPage: ${res.status} ${res.statusText}`);
        }
      });
    }
    document.body.classList.toggle("select-page");
  }

  componentDidUpdate(prevProps, prevState) {
  }
  
  toggleFrameNumbersTooltipOpen() {
    this.setState({
      frameNumbersTooltipOpen: !this.state.frameNumbersTooltipOpen
    });
  }

  frameNumbersHelpText() {
    return (
      <>
        <span className="small invalid_text">Please ensure your input has only a single number{' '}
          on each line and all of the numbers are between 0 and {this.state.numFrames-1} (Blank lines are ignored,{' '}
          scientific numbers will be truncated).
        </span>
      </>
    );
  }

  validateFrameNumbersInput(e) {
    if (e.target.value.length === 0) {
      this.setState({
        frameNumbersInvalid: true
      });
    }
    var nums = e.target.value.split('\n');
    var frames = [];
    for (var i = 0; i < nums.length; i++) {
      var n = parseInt(nums[i])
      if (isNaN(n) || n > this.state.numFrames || n <= 0) {
        this.setState({
          frameNumbersInvalid: true
        });
        break;
      } else {
        frames.push(n);
      }
    }
    this.setState({
      framesList: frames,
      frameNumbersInvalid: false
    });
  }

  startJPGTranscode() {
    fetch(address+'/startjpgtranscode').then(res => {
      if (!res.ok) {
        console.error(`GET /startjpgtranscode at NewProjectPage: ${res.status} ${res.statusText}`);
      }
    });
  }
  startPNGTranscode() {
    fetch(address+'/startpngtranscode').then(res => {
      if (!res.ok) {
        console.error(`GET /startpngtranscode at NewProjectPage: ${res.status} ${res.statusText}`);
      }
    });
  }

  setCancelled() {
    this.setState({
     cancelled: true
    });
  }


  render() {
    return (
      <>
        <h1>Select frames for {this.state.project}</h1>
        <div>
          <Form>
            <FormGroup>
              <Label for="inputFrameNumbers" id="frameNumbersToolTip">Frame numbers</Label>
              <Input type="textarea" id="inputFrameNumbers" onchange={e => this.validateFrameNumbersInput(e)} className={(this.state.invalid ? 'input_invalid' : null)} />
              (this.state.frameNumbersInvalid ? this.frameNumbersHelpText() : null)
            </FormGroup>
          </Form>
          <Link to="/transcode-jpg" onclick={this.startJPGTranscode()}>
            <Button id="createTooltip" color="primary">Extract JPGs</Button>
          </Link>
          <Link to="/" onclick={this.setCancelled()}>
            <Button id="createTooltip" color="primary">Back to menu</Button>
          </Link>
          <Link to="/transcode-png" onclick={this.startPNGTranscode()}>
            <Button id="createTooltip" color="primary">Extract PNGs</Button>
          </Link>

        </div>
        <Tooltip placement="left" isOpen={this.state.frameNumbersTooltipOpen} target="frameNumbersToolTip" toggle={this.toggleFrameNumbersTooltipOpen}>
          Frame numbers must be zero based, one on each line.
        </Tooltip>
      </>
    );
  }
}

export default SelectPage;
