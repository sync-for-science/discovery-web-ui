import React, { useEffect, useRef, useState } from 'react';
import { string } from 'prop-types';
import { useRecoilState } from 'recoil';
import CardActions from '@material-ui/core/CardActions';
import Button from '@material-ui/core/Button';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Collapse from '@material-ui/core/Collapse';
import CardContent from '@material-ui/core/CardContent';
import TextField from '@material-ui/core/TextField';
import { makeStyles } from '@material-ui/core/styles';
import { notesWithRecordId } from '../../recoil';

const useStyles = makeStyles((theme) => ({
  root: {
    marginTop: 10,
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
    marginBottom: 10,
  },
}));

const NotesEditor = ({ recordId }) => {
  const classes = useStyles();
  const [expanded, setExpanded] = useState(false);
  const [notesForThisRecord, saveNewNote] = useRecoilState(notesWithRecordId(recordId));

  const noteInput = useRef(null);

  const handleAddNote = (_event) => {
    saveNewNote(noteInput.current.value);
  };

  return (
    <>
      <CardActions disableSpacing className={classes.cardActions}>
        <Button variant="outlined" disableElevation size="small" onClick={() => setExpanded(!expanded)}>
          Notes
          <ExpandMoreIcon />
        </Button>
      </CardActions>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent>
          {/* {displayNotes} */}
          <TextField
            className={classes.noteField}
            id={`note-entry-${recordId}`}
            placeholder="New Note"
            variant="outlined"
            size="small"
            fullWidth
            inputRef={noteInput}
          />
          <Button variant="contained" disableElevation size="small" onClick={handleAddNote}>Add Note</Button>
        </CardContent>
      </Collapse>
    </>
  );
};

NotesEditor.prototype = {
  recordId: string.isRequired,
};

export default React.memo(NotesEditor);
