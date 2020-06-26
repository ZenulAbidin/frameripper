import React from "react";
import SelectedComponent from "./SelectedComponents.js";
import {Link} from "react-router-dom";
import {Button, Container, Row, Col, Tooltip, Jumbotron,
    Modal, ModalHeader, ModalBody, ModalFooter} from "reactstrap";

var process = require('process');
const address = process.env.SERVER_ADDRESS;

class Index extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      newTooltipOpen: false,
      deleteTooltipOpen: false,
      deleteModalOpen: false,
      projects: null
    };
  }

  toggleNewTooltip() {
    this.setState({
      newTooltipOpen: !this.state.newTooltipOpen
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
            project: json.project
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
        <h3>Select a project to open</h3>
        <div>
          <Jumbotron>
            <Container>
              <Row>
                {buttonsList()}
              </Row>
            </Container>
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
        <Tooltip placement="bottom" isOpen={this.state.newTooltipOpen} target="newTooltip" toggle={this.toggleNewTooltip}>
          Creates a new project.
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
