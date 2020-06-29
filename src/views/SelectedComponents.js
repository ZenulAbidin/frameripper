/* Credits: https://codesandbox.io/s/o7o241q09 */
import React, { useState, useEffect } from "react";

const Checkmark = ({ selected }) => (
  <div
    style={
      selected
        ? { left: "4px", top: "4px", position: "absolute", zIndex: "1" }
        : { display: "none" }
    }
  >
    <svg
      style={{ fill: "white", position: "absolute" }}
      width="24px"
      height="24px"
    >
      <circle cx="12.5" cy="12.2" r="8.292" />
    </svg>
    <svg
      style={{ fill: "#06befa", position: "absolute" }}
      width="24px"
      height="24px"
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
    </svg>
  </div>
);

const cont = {
  backgroundColor: "#eee",
  cursor: "pointer",
  overflow: "hidden",
  position: "relative"
};

class SelectedComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isSelected: false,
    };
    this.handleOnClick = this.handleOnClick.bind(this);
  }

  handleOnClick(e) {
    this.setState({
      isSelected: !this.state.isSelected
    });
  };

  componentDidMount() {
    document.body.classList.toggle("selectedcomponents");
  }
  componentWillUnmount() {
    document.body.classList.toggle("selectedcomponents");
  }

  render() {
    return (
      <div
        className={!this.state.isSelected ? "not-selected" : ""}
      >
        <Checkmark selected={this.state.isSelected ? true : false} />
        {this.props.children}
      </div>
    );
  }
};

export default SelectedComponent;

