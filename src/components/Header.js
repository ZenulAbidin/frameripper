import React from "react";
import {Form, FormGroup, Label, Input} from "reactstrap";
import "../assets/css/styles.css";

var address = localStorage.getItem('serverAddress') || '';

class Header extends React.Component {
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

  render() {
    return (
      <>
        <h1 className='title'>Frameripper by Zenul_Abidin</h1>
        { address === "" ? this.displayNoAddressHint() : this.displayServerAddress() }
      </>
    );
  }
}
export default Header;
