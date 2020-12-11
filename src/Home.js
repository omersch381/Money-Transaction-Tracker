import React from "react";

import BinaryContractTable from "./BinaryContractTable";
import RequestTable from "./RequestTable";

import Divider from "@material-ui/core/Divider";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";

import { blue } from "@material-ui/core/colors";

const useStyles = makeStyles({
  mainTitle: {
    fontWeight: "bold",
    paddingBottom: "40px",
  },
  title: {
    fontSize: 18,
    paddingBottom: "15px",
    fontWeight: "bold",
  },
  icon: {
    backgroundColor: blue,
  },
  distance: {
    marginBlock: "40px",
  },
});

const Home = () => {
  const classes = useStyles();

  return (
    <div>
      <Typography variant="h6" className={classes.mainTitle}>
        THIS IS THE PERSONAL CONTRACT VIEW
      </Typography>
      <Typography variant="h6" className={classes.title}>
        THESE ARE THE BINARY CONTRACTS
      </Typography>
      <BinaryContractTable />
      <Divider className={classes.distance} />
      <Typography variant="h6" className={classes.title}>
        THESE ARE YOUR REQUESTS
      </Typography>
      <RequestTable />
    </div>
  );
};

export default Home;
