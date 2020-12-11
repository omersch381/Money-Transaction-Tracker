import React from "react";
import PendingTransactions from "./PendingTransactions";

import Divider from "@material-ui/core/Divider";
import Typography from "@material-ui/core/Typography";

import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles({
  mainTitle: {
    fontWeight: "bold",
  },
  title: {
    fontSize: 18,
    paddingBlock: "15px",
    fontWeight: "bold",
  },
  sub: {
    fontSize: 14,
    color: "textSecondary",
    paddingBottom: "30px",
  },
});

export default function Wallet() {
  const classes = useStyles();

  return (
    <div>
      <div>
        <Typography variant="h3" className={classes.mainTitle}>
          Wallet details
        </Typography>
        <Typography className={classes.title}>Address:</Typography>
        <Typography className={classes.sub}>tempAddress</Typography>
        <Typography className={classes.title}>Balance:</Typography>
        <Typography className={classes.sub}>tempBalance</Typography>
        <Divider />
      </div>
      <div>
        <Typography variant="h3" className={classes.mainTitle}>
          Transactions
        </Typography>
        <PendingTransactions />
      </div>
    </div>
  );
}
