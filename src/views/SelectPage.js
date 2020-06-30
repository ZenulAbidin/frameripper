import React from "react";
import "../assets/css/styles.css";
import {Link} from "react-router-dom";
import {Form, FormGroup, Button, Input, Label, Tooltip} from "reactstrap";

const address = "http://iamomegastorm.tk:3030";

class SelectPage extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      frameNumbersTooltipOpen: false,
      framesList: [],
      numFrames: 0,
      project: null,
      inputFrameNumbers: "",
      frameNumbersInvalid: false,
      menuTooltipOpen: false,
    };

    this.toggleFrameNumbersTooltipOpen = this.toggleFrameNumbersTooltipOpen.bind(this);
    this.toggleMenuTooltipOpen = this.toggleMenuTooltipOpen.bind(this);
    this.frameNumbersHelpText = this.frameNumbersHelpText.bind(this);
    this.validateFrameNumbersInput = this.validateFrameNumbersInput.bind(this);
    this.startJPGTranscode = this.startJPGTranscode.bind(this);
    this.startPNGTranscode = this.startPNGTranscode.bind(this);
    this.sendOKRequest = this.sendOKRequest.bind(this);
  }

  toggleMenuTooltipOpen() {
    this.setState({
      menuTooltipOpen: !this.state.menuTooltipOpen
    });
  }

  toggleFrameNumbersTooltipOpen() {
    this.setState({
      frameNumbersTooltipOpen: !this.state.frameNumbersTooltipOpen
    });
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
        console.error(`GET /frameslist at SelectPage: ${res.status} ${res.statusText}\n(If you just created this project, ignore this error.)`);
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
        console.error(`GET /numframes at SelectPage: ${res.status} ${res.statusText}\n(If you just created this project, ignore this error.)`);
      }
    });
  }
  componentWillUnmount() {
    document.body.classList.toggle("select-page");
  }

  sendOKRequest() {
    var body = {'framesList': this.state.framesList.split('\n')};
    // send POST request
    fetch(address+'/frameslist', {
        method: 'post',
        body:    JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
    }).then(res => {
    	if (!res.ok) {
        console.error(`POST /frameslist with body ${JSON.stringify(body)} at SelectPage: ${res.status} ${res.statusText}`);
      }
    });
    fetch(address+'/startpngtranscode').then(res => {
      if (!res.ok) {
        console.error(`GET /startpngtranscode at SelectPage: ${res.status} ${res.statusText}`);
      }
    });
  }

  componentDidUpdate(prevProps, prevState) {
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
    if (this.state.numFrames !== 0) {
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
    }
    this.setState({
      framesList: frames,
      frameNumbersInvalid: false
    });
  }

  startJPGTranscode() {
    this.sendOKRequest();
    fetch(address+'/startjpgtranscode').then(res => {
      if (!res.ok) {
        console.error(`GET /startjpgtranscode at NewProjectPage: ${res.status} ${res.statusText}`);
      }
    });
  }
  startPNGTranscode() {
    this.sendOKRequest();
    fetch(address+'/startpngtranscode').then(res => {
      if (!res.ok) {
        console.error(`GET /startpngtranscode at NewProjectPage: ${res.status} ${res.statusText}`);
      }
    });
  }

  render() {
    return (
      <>
        <h1 className='title'>Frameripper by Zenul_Abidin</h1>
        <h3 style={{textAlign: 'center'}}>Select frames for {this.state.project}</h3>
        <div {{marginLeft: '1rem'}}>
          <Form>
            <FormGroup>
              <Label for="inputFrameNumbers" id="frameNumbersToolTip">Frame numbers</Label>
              <Input type="textarea" id="inputFrameNumbers" onchange={e => this.validateFrameNumbersInput(e)} className={(this.state.invalid ? 'input_invalid' : null)} />
              {this.state.frameNumbersInvalid ? this.frameNumbersHelpText() : null}
            </FormGroup>
          </Form>
          <div className='container'>
            <div className='centered-horz' style={{width: '50vw'}}>
              <Link to="/transcode-jpg" onclick={this.startJPGTranscode} className='container__child'>
                <Button id="createTooltip" color="primary">Extract JPGs</Button>
              </Link>
              <Link to="/settings" className='container__child'>
                <Button id="settingsTooltip" color="primary">Settings</Button>
              </Link>
              <Link to="/transcode-png" onclick={this.startPNGTranscode} className='container__child'>
                <Button id="createTooltip" color="primary">Extract PNGs</Button>
              </Link>
             <Link to="/" className='container__child'>
                <Button id="menuTooltip" color="primary">Back to menu</Button>
              </Link>
            </div>
          </div>
        </div>
        <Tooltip placement="left" isOpen={this.state.frameNumbersTooltipOpen} target="frameNumbersToolTip" toggle={this.toggleFrameNumbersTooltipOpen}>
          Frame numbers must be zero based, one on each line.
        </Tooltip>
        <Tooltip placement="left" isOpen={this.state.menuTooltipOpen} target="menuTooltip" toggle={this.toggleMenuTooltipOpen}>
          Cancel changes and return to main menu.
        </Tooltip>
      </>
    );
  }
}

export default SelectPage;
