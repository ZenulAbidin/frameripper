
import React from "react";
import SelectedComponent from "./SelectedComponent.js";
var process = require('process');
import {Button, Container, Row, Col, Link, Tooltip, Jumbotron,
    Modal, ModalHeader, ModalBody, ModalFooter} from "reactstrap";

const address = process.env.SERVER_ADDRESS;

class Index extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      newTooltipOpen: false,
      deleteTooltipOpen: false,
      deleteModalOpen: false,
      projects: undefined
    };
  }

  toggleNewTooltip() {
    this.setState({newTooltipOpen: !newTooltipOpen});
  }
  toggleDeleteTooltipOpen() {
    this.setState({deleteTooltipOpen: !deleteTooltipOpen});
  }
  toggleDeleteModalOpen() {
    this.setState({deleteModalOpen: !deleteModalOpen});
  }

  componentDidMount() {
    document.body.classList.toggle("index-page");
    fetch(address+'/projects').then(res => {
    	if (res.ok) {
        res.json().then(json => {
          this.state.projects = json.projects;
        })
      }
    })
  }
  componentWillUnmount() {
    document.body.classList.toggle("index-page");
  }

  deleteProject() {
    toggleDeleteModalOpen()
    body = {'project': selectedProject};
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
    /* Credits: https://stackoverflow.com/a/22877049/12452330 */
    var buttons = [];
    for (var i = 0; i < this.state.projects.length; i++) {
        // note: we add a key prop here to allow react to uniquely identify each
        // element in this array. see: https://reactjs.org/docs/lists-and-keys.html
        buttons.push(
          <Col sm="4">
            <SelectedComponent Component=<Button key={i}>{this.state.projects[i]}</Button> />
          </Col>
        );
    }
    return buttons;
  }


  render() {
    return (
      <>
        <h1>Projects</h1>
        <h3>Select a project to open<h3>
        <div>
        <Jumbotron>
          <Container>
            <Row>
              {this.buttonsList()}
            </Row>
          <Container>
        </Jumbotron>
        </div>
        <div>
          <Link to="/new">
            <Button id="newTooltip" color="primary">New</Button>
          </Link>
          <Link to="/">
            <Button id="deleteTooltip" color="danger">Delete</Button>
          </Link>
        </div>
        <Tooltip placement="bottom" isOpen={this.state.newTooltipOpen} target="newTooltip" toggle={toggleNewTooltip}>
          Creates a new project.
        </Tooltip>
        <Tooltip placement="bottom" isOpen={this.state.deleteTooltipOpen} target="deleteTooltip" toggle={toggleDeleteTooltipOpen}>
          Deletes the selected project.
        </Tooltip>
        <Modal isOpen={this.state.deleteModalOpen} toggle={toggleDeleteModalOpen}>
          <ModalHeader toggle={toggleDeleteModalOpen}>Delete project</ModalHeader>
          <ModalBody>
            You are about to delete project {selectedProject}. This cannot be undone!
          </ModalBody>
          <ModalFooter>
            <Button color="danger" onClick={toggleDeleteModalOpen}>Delete</Button>
            <Button color="primary" onClick={deleteProject}>Cancel</Button>
          </ModalFooter>
        </Modal>
      </>
    );
  }
}

export default Index;
