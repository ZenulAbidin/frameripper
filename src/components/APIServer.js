import React from "react";
import {Form, FormGroup, Label, Input, Button, Tooltip} from "reactstrap";
import "../assets/css/styles.css";

class APIServer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      addressTooltipOpen: false,
      serverAddress: ""
    };

    this.toggleAddressTooltipOpen = this.toggleAddressTooltipOpen.bind(this);
    this.setServerAddress = this.setServerAddress.bind(this);
    this.commitServerAddress = this.commitServerAddress.bind(this);
  }

  toggleAddressTooltipOpen() {
    this.setState({
      addressTooltipOpen: !this.state.addressTooltipOpen
    });
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

  render() {
    return (
      <>
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
        <p className='content_banner'><a href="https://github.com/ZenulAbidin/frameripper" target="_blank" rel="noopener noreferrer">View on Github</a></p>
        <Tooltip placement="bottom" isOpen={this.state.addressTooltipOpen} target="addressTooltip" toggle={this.toggleAddressTooltipOpen}>
          Sets the address of the API server to send queries to. It can be an IP address or a domain name and a path. port number can also be specified. Prepend {'http://'} or {'https://'} to it and don&apos;t end it with a slash.
        </Tooltip>
      </>
    );
  }
}

export default APIServer;
