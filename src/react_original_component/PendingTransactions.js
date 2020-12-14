import React from "react";
import BlockContentTable from "./BlockContentTable";

import Button from "@material-ui/core/Button";
import Grid from "@material-ui/core/Grid";

const PendingTransactions = () => {
  return (
    <div>
      <h1>THIS IS PENDING TRANSACTIONS</h1>
      <BlockContentTable />

      <div style={{ paddingTop: "30px" }}>
        <Grid
          container
          direction="row"
          justify="flex-start"
          alignItems="flex-start"
        >
          <Button variant="contained" color="primary">
            Start Mining
          </Button>
        </Grid>
      </div>
    </div>
  );
};

export default PendingTransactions;
