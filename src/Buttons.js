import React from "react";

import { makeStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import ButtonGroup from "@material-ui/core/ButtonGroup";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";

const useStyles = makeStyles((theme) => ({
  buttons: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    "& > *": {
      margin: theme.spacing(1),
    },
  },
}));

export default function Buttons() {
  const classes = useStyles();
  const [
    openFormDialogTransaction,
    setOpenFormDialogTransaction,
  ] = React.useState(false);

  const handleClickOpen = () => {
    setOpenFormDialogTransaction(true);
  };

  const handleClose = () => {
    setOpenFormDialogTransaction(false);
  };

  const [openFormDialogSettings, setOpenFormDialogSettings] = React.useState(
    false
  );
  const handleClickOpenSettings = () => {
    setOpenFormDialogSettings(true);
  };

  const handleCloseSettings = () => {
    setOpenFormDialogSettings(false);
  };

  return (
    <div className={classes.buttons}>
      <ButtonGroup variant="text" aria-label="text primary button group">
        <Button
          style={{ fontSize: "18px", fontWeight: "bold" }}
          onClick={handleClickOpen}
          color="inherit"
        >
          ADD TRANSACTION
        </Button>
        <Dialog
          open={openFormDialogTransaction}
          onClose={handleClose}
          aria-labelledby="form-dialog-title"
        >
          <DialogTitle id="form-dialog-title">
            ADD A NEW TRANSACTION
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              Transfer some money to someone!
            </DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              id="name"
              label="From Address"
              type="email"
              fullWidth
            />
            <TextField
              autoFocus
              margin="dense"
              id="name"
              label="To Address"
              type="email"
              fullWidth
            />
            <TextField
              autoFocus
              margin="dense"
              id="name"
              label="Amount"
              type="email"
              fullWidth
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} color="primary">
              Cancel
            </Button>
            <Button onClick={handleClose} color="primary">
              Sign and create transaction
            </Button>
          </DialogActions>
        </Dialog>
        <Button
          onClick={handleClickOpenSettings}
          style={{ fontSize: "18px", fontWeight: "bold" }}
          color="inherit"
        >
          Settings
        </Button>
        <Dialog
          open={openFormDialogSettings}
          onClose={handleCloseSettings}
          aria-labelledby="form-dialog-title"
        >
          <DialogTitle id="form-dialog-title">SETTINGS</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              id="difficulty"
              label="Difficulty"
              type="text"
              fullWidth
            />
            <TextField
              autoFocus
              margin="dense"
              id="reward"
              label="Reward"
              type="text"
              fullWidth
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseSettings} color="primary">
              Cancel
            </Button>
            <Button onClick={handleCloseSettings} color="primary">
              Confirm
            </Button>
          </DialogActions>
        </Dialog>
      </ButtonGroup>
    </div>
  );
}
