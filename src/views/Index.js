import React from "react";
import {Link} from "react-router-dom";
import {Button, Container, Row, Col, Tooltip, Jumbotron,
    Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label, Input} from "reactstrap";
import "../assets/css/styles.css";
import {wwwencode_partial, wwwencode_form, wwwdecode} from "../Utils";
import APIServer from "../components/APIServer";
import Header from "../components/Header";

var address = localStorage.getItem('serverAddress') || '';

class Index extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      newTooltipOpen: false,
      openTooltipOpen: false,
      deleteTooltipOpen: false,
      deleteModalOpen: false,
      projects: [],
      currentProject: null
    };

    this.toggleNewTooltip = this.toggleNewTooltip.bind(this);
    this.toggleOpenTooltip = this.toggleOpenTooltip.bind(this);
    this.toggleDeleteTooltipOpen = this.toggleDeleteTooltipOpen.bind(this);
    this.toggleDeleteModalOpen = this.toggleDeleteModalOpen.bind(this);
    this.deleteProject = this.deleteProject.bind(this);
    this.buttonList = this.buttonList.bind(this);
    this.setStateCurrentProject = this.setStateCurrentProject.bind(this);
    this.setCurrentProject = this.setCurrentProject.bind(this);
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

  componentDidMount() {
    document.body.classList.toggle("index-page");
    fetch(address+'/projects').then(res => {
    	if (res.ok) {
        res.json().then(json => {
          this.setState({
            projects: wwwdecode(json.projects)
          });
        })
      }
    })
  }
  componentWillUnmount() {
    document.body.classList.toggle("index-page");
  }

  deleteProject() {
    this.toggleDeleteModalOpen()
    var body = {'project': wwwencode_partial(this.state.selectedProject)};
    // send PUT request
    fetch(address+'/deleteproject', {
        method: 'post',
        body:    wwwencode_form(body),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }).then(res => {
    	if (!res.ok) {
        console.error(`POST /deleteproject with body ${JSON.stringify(body)} at Index: ${res.status} ${res.statusText}`);
      }
      else {
        fetch(address+'/projects').then(res => {
        	if (res.ok) {
            res.json().then(json => {
              this.setState({
                projects: wwwdecode(json.projects)
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
        <Header></Header>
        { address === "" ? null : this.content() }
        <APIServer></APIServer>
      </>
    );
  }
}

export default Index;
