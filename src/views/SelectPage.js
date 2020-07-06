import React from "react";
import "../assets/css/styles.css";
import {Link} from "react-router-dom";
import {Form, FormGroup, FormFeedback, Button, Input, Label, Tooltip} from "reactstrap";
import {wwwencode_partial, wwwencode_form, wwwdecode} from "../Utils";

var address = localStorage.getItem('serverAddress') || '';

class SelectPage extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      frameNumbersTooltipOpen: false,
      menuTooltipOpen: false,
      jpgTooltipOpen: false,
      pngTooltipOpen: false,
      settingsTooltipOpen: false,
      addressTooltipOpen: false,
      framesList: [],
      numFrames: 0,
      project: null,
      inputFrameNumbers: "",
      frameNumbersInvalid: false,
      ogFramesList: "",
      serverAddress: ""
    };

    this.toggleFrameNumbersTooltipOpen = this.toggleFrameNumbersTooltipOpen.bind(this);
    this.toggleMenuTooltipOpen = this.toggleMenuTooltipOpen.bind(this);
    this.toggleJPGTooltipOpen = this.toggleJPGTooltipOpen.bind(this);
    this.togglePNGTooltipOpen = this.togglePNGTooltipOpen.bind(this);
    this.toggleSettingsTooltipOpen = this.toggleSettingsTooltipOpen.bind(this);
    this.toggleAddressTooltipOpen = this.toggleAddressTooltipOpen.bind(this);
    this.frameNumbersHelpText = this.frameNumbersHelpText.bind(this);
    this.validateFrameNumbersInput = this.validateFrameNumbersInput.bind(this);
    this.startJPGTranscode = this.startJPGTranscode.bind(this);
    this.startPNGTranscode = this.startPNGTranscode.bind(this);
    this.setServerAddress = this.setServerAddress.bind(this);
    this.commitServerAddress = this.commitServerAddress.bind(this);
    this.content = this.content.bind(this);
  }

  toggleMenuTooltipOpen() {
    this.setState({
      menuTooltipOpen: !this.state.menuTooltipOpen
    });
  }

  toggleJPGTooltipOpen() {
    this.setState({
      jpgTooltipOpen: !this.state.jpgTooltipOpen
    });
  }

  togglePNGTooltipOpen() {
    this.setState({
      pngTooltipOpen: !this.state.pngTooltipOpen
    });
  }

  toggleSettingsTooltipOpen() {
    this.setState({
      settingsTooltipOpen: !this.state.settingsTooltipOpen
    });
  }

  toggleFrameNumbersTooltipOpen() {
    this.setState({
      frameNumbersTooltipOpen: !this.state.frameNumbersTooltipOpen
    });
  }

  toggleAddressTooltipOpen() {
    this.setState({
      addressTooltipOpen: !this.state.addressTooltipOpen
    });
  }

  componentDidMount() {
    fetch(address+'/currentproject').then(res => {
      if (res.ok) {
        res.json().then(json => {
          var currentProject_decoded = wwwdecode(json.currentProject)
          this.setState({
            project: currentProject_decoded
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
          var framesList_decoded = wwwdecode(json.framesList)
          this.setState({
            framesList: framesList_decoded,
            ogFramesList: framesList_decoded.join('\n')
          });
        })
      }
      else {
        console.error(`GET /frameslist at SelectPage: ${res.status} ${res.statusText}\n(If you just created this project, ignore this error.)`);
      }
    })
    fetch(address+'/numframes').then(res => {
      if (res.ok) {
        res.json().then(json => {
          var numFrames_decoded = wwwdecode(json.numFrames)
          this.setState({
            numFrames: numFrames_decoded
          });
        })
      }
      else {
        console.error(`GET /numframes at SelectPage: ${res.status} ${res.statusText}\n(If you just created this project, ignore this error.)`);
      }
    });
    document.body.classList.toggle("select-page");
  }
  componentWillUnmount() {
    document.body.classList.toggle("select-page");
  }

  componentDidUpdate(prevProps, prevState) {
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


  frameNumbersHelpText() {
/*
        <span className="small invalid_text">Please ensure your input has only a single number{' '}
          on each line and all of the numbers are between 0 and {this.state.numFrames-1} (Blank lines are ignored,{' '}
          scientific numbers will be truncated).
        </span>
*/
    return (
      <>
        <FormFeedback>Please ensure your input has only a single number{' '}
          on each line and all of the numbers are between 1 and {this.state.numFrames} (Blank lines are ignored,{' '}
          scientific numbers will be truncated).</FormFeedback>
      </>
    );
  }

  validateFrameNumbersInput(e) {
    this.setState({
      ogFramesList: e.target.value
    });
    if (e.target.value.length === 0) {
      return;
    }
    var invalid = false;
    if (this.state.numFrames !== 0) {
      var nums = e.target.value.replace(/\n+/g,'\n').split('\n');
      var frames = [];
      for (var i = 0; i < nums.length; i++) {
        var n = parseInt(nums[i])
        if (isNaN(n) || n > this.state.numFrames || n <= 0) {
          this.setState({
            frameNumbersInvalid: true
          });
          invalid = true;
          break;
        } else {
          frames.push(n);
          invalid = false;
        }
      }
    }
    if (!invalid) {
      this.setState({
        framesList: frames,
        frameNumbersInvalid: false
      });
    }
  }

  startJPGTranscode() {
    var body = {'framesList': this.state.framesList};
    // send POST request
    fetch(address+'/frameslist', {
        method: 'post',
        body:    JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
    }).then(res => {
    	if (!res.ok) {
        console.error(`POST /frameslist with body ${JSON.stringify(body)} at SelectPage: ${res.status} ${res.statusText}`);
      } else {
        fetch(address+'/startjpgtranscode').then(res => {
          if (!res.ok) {
            console.error(`GET /startjpgtranscode at SelectPage: ${res.status} ${res.statusText}`);
          }
        });
      }
    });
  }
  startPNGTranscode() {
    var body = {'framesList': this.state.framesList};
    // send POST request
    fetch(address+'/frameslist', {
        method: 'post',
        body:    JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
    }).then(res => {
    	if (!res.ok) {
        console.error(`POST /frameslist with body ${JSON.stringify(body)} at SelectPage: ${res.status} ${res.statusText}`);
      } else {
        fetch(address+'/startpngtranscode').then(res => {
          if (!res.ok) {
            console.error(`GET /startpngtranscode at SelectPage: ${res.status} ${res.statusText}`);
          }
        });
      }
    });
  }

  content() {
    return (
      <>
        <h3 style={{textAlign: 'center'}}>Select frames for {this.state.project}</h3>
        <div style={{marginLeft: '1rem'}}>
          <Form>
            <FormGroup style={{marginRight: '1rem'}}>
              <Label for="inputFrameNumbers" id="frameNumbersToolTip">Frame numbers</Label>
              <Input type="textarea" id="inputFrameNumbers" onChange={e => this.validateFrameNumbersInput(e)} invalid={this.state.frameNumbersInvalid ? true : false } 
                  value={this.state.ogFramesList}/>
              {this.state.frameNumbersInvalid ? this.frameNumbersHelpText() : null}
            </FormGroup>
          </Form>
          <div className='container'>
            <div className='centered-horz' style={{width: '50vw'}}>
              <Link to="/transcode-jpg" onClick={this.startJPGTranscode} className='container__child'>
                <Button id="jpgTooltip" color="primary" disabled={this.state.frameNumbersInvalid}>Extract JPGs</Button>
              </Link>
              <Link to="/settings" className='container__child'>
                <Button id="settingsTooltip" color="primary" disabled={this.state.frameNumbersInvalid}>Settings</Button>
              </Link>
              <Link to="/transcode-png" onClick={this.startPNGTranscode} className='container__child'>
                <Button id="pngTooltip" color="primary" disabled={this.state.frameNumbersInvalid}>Extract PNGs</Button>
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
        <Tooltip placement="bottom" isOpen={this.state.jpgTooltipOpen} target="jpgTooltip" toggle={this.toggleJPGTooltipOpen}>
          Begin extracting JPG frames.
        </Tooltip>
        <Tooltip placement="bottom" isOpen={this.state.settingsTooltipOpen} target="settingsTooltip" toggle={this.toggleSettingsTooltipOpen}>
          Change the settings for this project.
        </Tooltip>
        <Tooltip placement="bottom" isOpen={this.state.pngTooltipOpen} target="pngTooltip" toggle={this.togglePNGTooltipOpen}>
          Begin extracting PNG frames.
        </Tooltip>
        <Tooltip placement="bottom" isOpen={this.state.menuTooltipOpen} target="menuTooltip" toggle={this.toggleMenuTooltipOpen}>
          Cancel changes and return to main menu.
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

export default SelectPage;
