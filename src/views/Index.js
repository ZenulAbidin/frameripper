import React from "react";
import {Link} from "react-router-dom";
import {Button, Container, Row, Col, Tooltip, Jumbotron,
    Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label, Input} from "reactstrap";
import "../assets/css/styles.css";

var address = localStorage.getItem('serverAddress') || '';

class Index extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      newTooltipOpen: false,
      openTooltipOpen: false,
      deleteTooltipOpen: false,
      deleteModalOpen: false,
      saveTooltipOpen: false,
      projects: [],
      currentProject: null,
      serverAddress: ""
    };

    this.toggleNewTooltip = this.toggleNewTooltip.bind(this);
    this.toggleOpenTooltip = this.toggleOpenTooltip.bind(this);
    this.toggleDeleteTooltipOpen = this.toggleDeleteTooltipOpen.bind(this);
    this.toggleDeleteModalOpen = this.toggleDeleteModalOpen.bind(this);
    this.toggleSaveTooltipOpen = this.toggleSaveTooltipOpen.bind(this);
    this.deleteProject = this.deleteProject.bind(this);
    this.buttonList = this.buttonList.bind(this);
    this.setStateCurrentProject = this.setStateCurrentProject.bind(this);
    this.setCurrentProject = this.setCurrentProject.bind(this);
    this.setServerAddress = this.setServerAddress.bind(this);
    this.commitServerAddress = this.commitServerAddress.bind(this);
    this.content = this.content.bind(this);
  }

  toggleNewTooltip() {
    this.setState({
      newTooltipOpen: !this.state.newTooltipOpen
    });
  }
  toggleOpenTooltip() {
    this.setState({
      openTooltipOpen: !this.state.openTooltipOpen
    });
  }
  toggleDeleteTooltipOpen() {
    this.setState({
      deleteTooltipOpen: !this.state.deleteTooltipOpen
    });
  }
  toggleDeleteModalOpen() {
    this.setState({
      deleteModalOpen: !this.state.deleteModalOpen
    });
  }
  toggleSaveTooltipOpen() {
    this.setState({
      saveTooltipOpen: !this.state.saveTooltipOpen
    });
  }

  componentDidMount() {
    document.body.classList.toggle("index-page");
    fetch(address+'/projects').then(res => {
    	if (res.ok) {
        res.json().then(json => {
          this.setState({
            projects: json.projects
          });
        })
      }
    })
  }
  componentWillUnmount() {
    document.body.classList.toggle("index-page");
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

  deleteProject() {
    this.toggleDeleteModalOpen()
    var body = {'project': this.state.selectedProject};
    // send PUT request
    fetch(address+'/deleteproject', {
        method: 'post',
        body:    JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
    }).then(res => {
    	if (!res.ok) {
        console.error(`POST /deleteproject with body ${JSON.stringify(body)} at Index: ${res.status} ${res.statusText}`);
      }
      else {
        fetch(address+'/projects').then(res => {
        	if (res.ok) {
            res.json().then(json => {
              this.setState({
                projects: json.projects
              });
            })
          }
        })
      }
    })

  }

  buttonList() {
    return (
      this.state.projects.map(project => (
      <Col sm="4" key={project}>
            <Button color="info" className='container__child' active={this.state.currentProject === project} onClick={() => this.setStateCurrentProject(project)}>{project}</Button>
      </Col>))
    )
  }

  setStateCurrentProject(project) {
    this.setState({
      currentProject: (this.state.currentProject !== project) ? project : null
    });
  }

  setCurrentProject() {
    var body = {'currentProject': this.state.currentProject};
    // send POST request
    fetch(address+'/currentproject', {
        method: 'post',
        body:    JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
    }).then(res => {
    	if (!res.ok) {
        console.error(`POST /currentproject with body ${JSON.stringify(body)} at Index: ${res.status} ${res.statusText}`);
      }
    });
  }

  content() {
    return (
      <>
        <h3 style={{textAlign: 'center'}}>Select a project to open</h3>
        <div>
          <Jumbotron>
            <Container>
              <Row>
                {this.buttonList()}
              </Row>
            </Container>
          </Jumbotron>
        </div>
        <div className='container'>
          <div className='centered-horz'>
            <Link to="/new" className='container__child'>
              <Button id="newTooltip" color="primary">New</Button>
            </Link>
            <Link to="/select" className='container__child'>
              <Button id="openTooltip" color="primary" disabled={this.state.currentProject === null} onClick={this.setCurrentProject}>Open</Button>
            </Link>
            <Link to="/" className='container__child'>
              <Button id="deleteTooltip" color="danger" onClick={this.toggleDeleteModalOpen} disabled={this.state.currentProject === null}>Delete</Button>
            </Link>
          </div>
        </div>
        <Tooltip placement="bottom" isOpen={this.state.newTooltipOpen} target="newTooltip" toggle={this.toggleNewTooltip}>
          Creates a new project.
        </Tooltip>
        <Tooltip placement="bottom" isOpen={this.state.openTooltipOpen} target="openTooltip" toggle={this.toggleOpenTooltip}>
          Opens the selected project.
        </Tooltip>
        <Tooltip placement="bottom" isOpen={this.state.deleteTooltipOpen} target="deleteTooltip" toggle={this.toggleDeleteTooltipOpen}>
          Deletes the selected project.
        </Tooltip>
        <Tooltip placement="bottom" isOpen={this.state.saveTooltipOpen} target="saveTooltip" toggle={this.toggleSaveTooltipOpen}>
          Sets the address of the API server to send queries to. It can be an IP address or a domain name and a path. port number can also be specified. Prepend {'http://'} or {'https://'} to it and don&apos;t end it with a slash.
        </Tooltip>
        <Modal isOpen={this.state.deleteModalOpen} toggle={this.toggleDeleteModalOpen}>
          <ModalHeader toggle={this.toggleDeleteModalOpen}>Delete project</ModalHeader>
          <ModalBody>
            You are about to delete project {this.state.currentProject}. This cannot be undone!
          </ModalBody>
          <ModalFooter>
            <Button color="danger" onClick={this.deleteProject}>Delete</Button>
            <Button color="primary" onClick={this.toggleDeleteModalOpen}>Cancel</Button>
          </ModalFooter>
        </Modal>
      </>
    )
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
                <Label for="serverAddress" id="saveTooltip">API server address</Label>
                <Input type="text" id="serverAddress" onChange={e => this.setServerAddress(e)} onKeyPress={(t) => {if (t.charCode===13) {this.commitServerAddress()}}}
                    value={this.state.serverAddress}/>
                 <Button id="saveTooltip" color="primary" onClick={this.commitServerAddress}>Save address</Button>
              </FormGroup>
            </Form>
          </div>
        </div>
      </>
    );
  }
}

export default Index;
