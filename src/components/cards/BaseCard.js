import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import Button from '@material-ui/core/Button';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import Collapse from '@material-ui/core/Collapse';
import IconButton from '@material-ui/core/IconButton';
import TextField from '@material-ui/core/TextField';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import CloseIcon from '@material-ui/icons/Close';
import { format } from 'date-fns';

const useStyles = makeStyles((theme) => ({
  root: {
    maxWidth: "100%",
    marginTop: 10,
    backgroundColor: "#e9edf4" // TODO add colors to theme
  },
  media: {
    height: 0,
    paddingTop: '56.25%', // 16:9
  },
  expand: {
    transform: 'rotate(0deg)',
    marginLeft: 'auto',
    transition: theme.transitions.create('transform', {
      duration: theme.transitions.duration.shortest,
    }),
  },
  expandOpen: {
    transform: 'rotate(180deg)',
  },
  cardActions: {
    padding: 16,
  },
  noteField: {
    marginBottom: 10
  }
}));

const BaseCard = ({ data, showDate, children }) => {
  const classes = useStyles();
  const [expanded, setExpanded] = React.useState(false);

  // if record in RecordPicker is 'stacked', data comes in as the first element of an array
  const { data: nestedData, itemDate, category } = data
  const displayDate = nestedData.period ? nestedData.period.end : itemDate
  const formattedDate = format(new Date(displayDate), 'MMM d, y h:mm:ssaaa');

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  return (
    <Card className={classes.root} variant="outlined">
      <CardHeader
        action={(
          <IconButton aria-label="remove">
            <CloseIcon />
          </IconButton>
        )}
        title={category}
        subheader={formattedDate}
        titleTypographyProps={{ variant: 'button' }}
        subheaderTypographyProps={{ variant: 'body2' }}
      />
      <CardContent>
        {children}
      </CardContent>
      <CardActions disableSpacing className={classes.cardActions}>
        <Button variant="outlined" disableElevation size="small" onClick={handleExpandClick}>
          Notes <ExpandMoreIcon />
        </Button>
      </CardActions>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent>
          <TextField
            className={classes.noteField}
            id="note"
            placeholder="New Note"
            variant="outlined"
            size="small"
            fullWidth
          />
          <Button variant="contained" disableElevation size="small">Add Note</Button>
        </CardContent>
      </Collapse>
    </Card>
  );
};

export default BaseCard;
