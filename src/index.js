import React from "react";
import ReactDOM from "react-dom";
import Dashboard from "./Dashboard";
import { BrowserRouter as Router } from "react-router-dom";

ReactDOM.render(
  <Router>
    <Dashboard />
  </Router>,
  document.getElementById("root")
);
