import React from "react";
import { Link } from "react-router-dom";

import ListItem from "@material-ui/core/ListItem";
import AccountTreeIcon from "@material-ui/icons/AccountTree";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import ListSubheader from "@material-ui/core/ListSubheader";
import DashboardIcon from "@material-ui/icons/Dashboard";
import PeopleIcon from "@material-ui/icons/People";
import SettingsApplicationsIcon from "@material-ui/icons/SettingsApplications";
import AssignmentIcon from "@material-ui/icons/Assignment";

export const mainListItems = (
  <div>
    <ListItem button component={Link} to="/">
      <ListItemIcon>
        <DashboardIcon />
      </ListItemIcon>
      <ListItemText primary="Profile Contract View" />
    </ListItem>
    <ListItem button component={Link} to="/friends">
      <ListItemIcon>
        <AccountTreeIcon />
      </ListItemIcon>
      <ListItemText primary="Friends" />
    </ListItem>
    <ListItem button component={Link} to="/walletOne">
      <ListItemIcon>
        <PeopleIcon />
      </ListItemIcon>
      <ListItemText primary="Profile Contract View" />
    </ListItem>
    <ListItem button component={Link} to="/walletTwo">
      <ListItemIcon>
        <PeopleIcon />
      </ListItemIcon>
      <ListItemText primary="Wallet 2" />
    </ListItem>
    <ListItem button component={Link} to="/miner">
      <ListItemIcon>
        <SettingsApplicationsIcon />
      </ListItemIcon>
      <ListItemText primary="Miner" />
    </ListItem>
  </div>
);

export const secondaryListItems = (
  <div>
    <ListSubheader inset>Saved reports</ListSubheader>
    <ListItem button>
      <ListItemIcon>
        <AssignmentIcon />
      </ListItemIcon>
      <ListItemText primary="Admin Related" />
    </ListItem>
    <ListItem button>
      <ListItemIcon>
        <AssignmentIcon />
      </ListItemIcon>
      <ListItemText primary="Admin Related" />
    </ListItem>
    <ListItem button>
      <ListItemIcon>
        <AssignmentIcon />
      </ListItemIcon>
      <ListItemText primary="Admin Related" />
    </ListItem>
  </div>
);
