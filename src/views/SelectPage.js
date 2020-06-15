import React from "react";
import "./styles.css";
import {Link} from "react-router-dom";
import {Form, FormGroup, Button, Input, Label, Tooltip} from "reactstrap";

var process = require('process');

const address = process.env.SERVER_ADDRESS;

class SelectPage extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      frameNumbersTooltipOpen: false,
      extractTooltipOpen: false,
      framesList: null,
      numFrames: null,
      project: null,
      inputFrameNumbers: "",
      frameNumbersInvalid: false
    };
  }

  componentDidMount() {
    document.body.classList.toggle("select-page");
    fetch(address+'/currentproject').then(res => {
      if (res.ok) {
        res.json().then(json => {
          this.state.project = json.project;
        })
      }
      else {
        console.error(`GET /currentproject at SelectPage: ${res.status} ${res.statusText}`);
      }
    })
    fetch(address+'/frameslist').then(res => {
      if (res.ok) {
        res.json().then(json => {
          this.state.framesList = json.framesList;
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
          this.state.numFrames = json.numFrames;
        })
      }
      else {
        console.error(`GET /numframes at SelectPage: ${res.status} ${res.statusText}`);
      }
    });
  }
  componentWillUnmount() {
    if (!this.state.canceled) {
      var body = {'framesList': this.state.framesList};
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
    this.state.frameNumbersTooltipOpen = !this.state.frameNumbersTooltipOpen;
  }
  toggleExtractTooltipOpen() {
    this.state.extractTooltipOpen = !this.state.extractTooltipOpen;
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
    this.state.inputFrameNumbers = e.target.value;
    if (this.state.inputFrameNumbers.length === 0) {
      this.state.frameNumbersInvalid = true;
    }
    var nums = this.state.inputFrameNumbers.split('\n');
    var frames = [];
    for (var i = 0; i < nums.length; i++) {
      var n = parseInt(nums[i])
      if (isNaN(n)) {
        this.state.frameNumbersInvalid = true;
        break;
      } else {
        frames.push(n);
      }
    }
    this.state.framesList = frames;
    this.state.frameNumbersInvalid = false;
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
          <Link to="/transcode-png">
            <Button id="createTooltip" color="primary">Create</Button>
          </Link>
          <Link to="/" onclick={this.state.canceled = true}>
            <Button id="createTooltip" color="primary">Cancel</Button>
          </Link>
        </div>
        <Tooltip placement="left" isOpen={this.state.frameNumbersTooltipOpen} target="frameNumbersToolTip" toggle={this.toggleFrameNumbersTooltipOpen}>
          Frame numbers must be zero based, one on each line.
        </Tooltip>
        <Tooltip placement="bottom" isOpen={this.state.extractTooltipOpen} target="extractTooltip" toggle={this.toggleExtractTooltip}>
          Begin extracting PNG images of the selected frames.
        </Tooltip>
      </>
    );
  }
}

export default SelectPage;
