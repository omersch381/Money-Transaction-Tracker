import React from "react";
import UserService from "./UserService";

//Material-ui components
import Card from "@material-ui/core/Card";
import CardActions from "@material-ui/core/CardActions";
import CardContent from "@material-ui/core/CardContent";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import Grid from "@material-ui/core/Grid";
// import { makeStyles } from "@material-ui/core/styles";

// const useStyles = makeStyles((theme) => ({
//   root: {
//     flexGrow: 1,
//     padding: theme.spacing(2),
//   },
// }));

// const classes = useStyles();

class Friends extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      users: [],
    };
  }

  componentDidMount() {
    UserService.getAllUsers().then((response) => {
      this.setState({ users: response.data });
    });
  }

  render() {
    return (
      <div>
        <h1>THIS IS FRIENDS</h1>
        {this.state.users.map((user) => (
          <div>
            {/* <Grid container className={classes.root} spacing={2}> */}
            <Grid container>
              <Grid item xs={12}>
                <Grid container justify="center">
                  <Grid key={user.id.email} item>
                    {/* <Card className={classes.root}> */}
                    <Card>
                      <CardContent>
                        <Typography
                          // className={classes.title}
                          color="textSecondary"
                          gutterBottom
                        >
                          {user.id.space}
                        </Typography>
                        <Typography variant="h5" component="h2">
                          {user.username}
                        </Typography>
                        {/* <Typography className={classes.pos} color="textSecondary"> */}
                        <Typography color="textSecondary">
                          {user.id.email}
                        </Typography>
                        <Typography variant="body2" component="p">
                          {user.role}
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Button size="small">{user.avatar}</Button>
                      </CardActions>
                    </Card>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </div>
        ))}
      </div>
    );
  }
}

export default Friends;
