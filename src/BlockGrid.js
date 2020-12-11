import React from "react";
import Block from "./Block";

import GridList from "@material-ui/core/GridList";
import { makeStyles } from "@material-ui/core/styles";
import { GridListTile } from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-around",
    overflow: "hidden",
    backgroundColor: theme.palette.background.paper,
  },
  gridList: {
    flexWrap: "nowrap",
    // Promote the list into his own layer on Chrome. This cost memory but helps keeping high FPS.
    transform: "translateZ(0)",
  },
  title: {
    color: theme.palette.primary.light,
  },
  titleBar: {
    background:
      "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0) 100%)",
  },
}));

export default function BlockGrid() {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <GridList className={classes.gridList} cols={2.5}>
        {/* {tileData.map((tile) => ( */}
        <GridListTile style={{ height: "340px" }}>
          <Block style={{ paddingLeft: "25px" }} />
        </GridListTile>
        <GridListTile style={{ height: "340px" }}>
          <Block style={{ paddingLeft: "25px" }} />
        </GridListTile>
        <GridListTile style={{ height: "340px" }}>
          <Block style={{ paddingLeft: "25px" }} />
        </GridListTile>

        {/* ))} */}
      </GridList>
    </div>
  );
}
