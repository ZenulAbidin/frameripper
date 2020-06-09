
import React from "react";
import "./styles.css";
var process = require('process');
import {Form, FormGroup, Button, Input, Label, Link, Tooltip} from "reactstrap";

const address = process.env.SERVER_ADDRESS;

class SelectPage extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      frameNumbersTooltipOpen: false,
      extractTooltipOpen: false,
      framesList: undefined,
      numFrames: undefined,
      project: undefined,
      invalid: false
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
      body = {'framesList': this.state.framesList};
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
    this.setState({frameNumbersTooltipOpen: !frameNumbersTooltipOpen});
  }
  toggleExtractTooltipOpen() {
    this.setState({extractTooltipOpen: !extractTooltipOpen});
  }

  helpText() {
    return (
      <>
        <span className="small invalid_text">Please ensure your input has only a single number{' '}
          on each line and all of the numbers are between 0 and {this.state.numFrames-1}.
        </span>
      </>
    );
  }

  render() {
    return (
      <>
        <h1>Select frames for {this.state.project}</h1>
        <div>
          <Form>
            <FormGroup>
              <Label for="inputFrameNumbers" id="frameNumbersToolTip">Frame numbers</Label>
              <Input type="textarea" id="inputFrameNumbers" className={(this.state.invalid ? 'input_invalid' : null)} />
              (this.state.invalid ? this.helpText() : null)
            </FormGroup>
          </Form>
          <Link to="/transcode-png">
            <Button id="createTooltip" color="primary">Create</Button>
          </Link>
          <Link to="/">
            <Button id="createTooltip" color="primary" onclick={() => {this.state.canceled = true;}>Cancel</Button>
          </Link>
        </div>
        <Tooltip placement="left" isOpen={this.state.frameNumbersTooltipOpen} target="frameNumbersToolTip" toggle={toggleFrameNumbersTooltipOpen}>
          Frame numbers must be zero based, one on each line.
        </Tooltip>
        <Tooltip placement="bottom" isOpen={this.state.extractTooltipOpen} target="extractTooltip" toggle={toggleExtractTooltip}>
          Begin extracting PNG images of the selected frames.
        </Tooltip>
      </>
    );
  }
}

export default SelectPage;
