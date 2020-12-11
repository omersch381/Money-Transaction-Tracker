import React from "react";

import { makeStyles } from "@material-ui/core/styles";
import IconButton from "@material-ui/core/IconButton";
import ButtonGroup from "@material-ui/core/ButtonGroup";
import CheckIcon from "@material-ui/icons/Check";
import CloseIcon from "@material-ui/icons/Close";
import { green, red } from "@material-ui/core/colors";

import Paper from "@material-ui/core/Paper";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TablePagination from "@material-ui/core/TablePagination";
import TableRow from "@material-ui/core/TableRow";

const columns = [
  {
    id: "from",
    label: "From",
    minWidth: 150,
    format: (value) => value.toLocaleString("en-US"),
  },
  {
    id: "type",
    label: "Type",
    minWidth: 60,
    align: "right",
    format: (value) => value.toLocaleString("en-US"),
  },
  {
    id: "message",
    label: "Message",
    minWidth: 170,
    align: "right",
    format: (value) => value.toLocaleString("en-US"),
  },
  {
    id: "response",
    label: "Response",
    minWidth: 50,
    align: "right",
    format: (value) => value.toLocaleString("en-US"),
  },
];

function createData(from, type, message, response) {
  return { from, type, message, response };
}

const rows = [
  createData("fromAddress", "type", "some message", re()),
  createData("fromAddress", "type", "some message", re()),
  createData("fromAddress", "type", "some message", re()),
];

const useStyles = makeStyles({
  root: {
    width: "100%",
  },
  container: {
    maxHeight: 440,
  },
});

function re() {
  return (
    <ButtonGroup>
      <IconButton color="secondary" aria-label="add an alarm">
        <CheckIcon style={{ color: "snow", backgroundColor: green[500] }} />
      </IconButton>
      <IconButton color="secondary" aria-label="add an alarm">
        <CloseIcon style={{ color: "snow", backgroundColor: red[500] }} />
      </IconButton>
    </ButtonGroup>
  );
}

export default function RequestTable() {
  const classes = useStyles();
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  return (
    <Paper className={classes.root}>
      <TableContainer className={classes.container}>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  style={{ minWidth: column.minWidth }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row) => {
                return (
                  <TableRow hover role="checkbox" tabIndex={-1} key={row.code}>
                    {columns.map((column) => {
                      const value = row[column.id];
                      return (
                        <TableCell key={column.id} align={column.align}>
                          {column.format && typeof value === "number"
                            ? column.format(value)
                            : value}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 25, 100]}
        component="div"
        count={rows.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onChangePage={handleChangePage}
        onChangeRowsPerPage={handleChangeRowsPerPage}
      />
    </Paper>
  );
}
