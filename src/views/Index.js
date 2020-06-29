import React from "react";
import SelectedComponent from "./SelectedComponents.js";
import {Link} from "react-router-dom";
import {Button, Container, Row, Col, Tooltip, Jumbotron,
    Modal, ModalHeader, ModalBody, ModalFooter} from "reactstrap";

var process = require('process');
const address = "http://iamomegastorm.tk:3030";

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
            projects: json.projects
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
    var body = {'project': this.state.selectedProject};
    // send PUT request
    fetch(address+'/deleteproject', {
        method: 'put',
        body:    JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
    }).then(res => {
    	if (!res.ok) {
        console.error(`PUT /deleteproject with body ${JSON.stringify(body)} at Index: ${res.status} ${res.statusText}`);
      }
    })
  }

  buttonList() {
    return (
      this.state.projects.map(project => (
      <Col sm="4" key={project}>
            <Button color="info" active={this.state.currentProject === project}>{project}</Button>
      </Col>))
    )
  }

  setStateCurrentProject(e) {
    this.setState({
      currentProject: e.target.value
    });
    console.log(e.target.value);
  }


  render() {
    return (
      <>
        <h1>Projects</h1>
        <h3>Select a project to open</h3>
        <div>
          <Jumbotron>
            <Container>
              <Row>
                {this.buttonList()}
              </Row>
            </Container>
          </Jumbotron>
        </div>
        <div>
          <Link to="/new">
            <Button id="newTooltip" color="primary">New</Button>
          </Link>
          <Link to="/select">
            <Button id="openTooltip" color="primary">Open</Button>
          </Link>
          <Link to="/">
            <Button id="deleteTooltip" color="danger" onClick={this.toggleDeleteModalOpen}>Delete</Button>
          </Link>
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
            You are about to delete project {this.state.selectedProject}. This cannot be undone!
          </ModalBody>
          <ModalFooter>
            <Button color="danger" onClick={this.toggleDeleteModalOpen}>Delete</Button>
            <Button color="primary" onClick={this.deleteProject}>Cancel</Button>
          </ModalFooter>
        </Modal>
      </>
    );
  }
}

export default Index;
