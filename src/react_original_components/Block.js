import React from "react";

import { makeStyles } from "@material-ui/core/styles";
import Divider from "@material-ui/core/Divider";
import Card from "@material-ui/core/Card";
import CardActions from "@material-ui/core/CardActions";
import CardContent from "@material-ui/core/CardContent";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";

const useStyles = makeStyles({
  root: {
    minWidth: 275,
  },
  title: {
    fontSize: 14,
  },
  pos: {
    marginBottom: 12,
  },
});

export default function Block() {
  const classes = useStyles();

  return (
    <Card className={classes.root} variant="outlined">
      <CardContent>
        <Typography variant="h5" component="h2">
          Block
        </Typography>
        <Divider />
        <Typography>Hash of this block</Typography>
        <Typography
          className={classes.title}
          color="textSecondary"
          // gutterBottom
        >
          Hash
        </Typography>
        <Typography>Hash of previous block</Typography>
        <Typography
          className={classes.title}
          color="textSecondary"
          // gutterBottom
        >
          Hash
        </Typography>
        <Divider />
        <Typography className={classes.title}>Nonce</Typography>
        <Typography className={classes.pos} color="textSecondary">
          some number
        </Typography>
        <Divider />
        <Typography className={classes.title}>Time stamp</Typography>
        <Typography className={classes.pos} color="textSecondary">
          some timestamp
        </Typography>
      </CardContent>
      <CardActions>
        <Button size="small">Learn More</Button>
      </CardActions>
    </Card>
  );
}
