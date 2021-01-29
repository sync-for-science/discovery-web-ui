import React, { useState } from 'react';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';

import { formatDate } from './GenericCardBody';

const useStyles = makeStyles(() => ({
  root: {
    marginBottom: 30,
  },
  noteHeader: {
    marginBottom: 5,
  },
  editTextField: {
    marginBottom: 10,
  },
}));

const CompletedNote = ({
  noteText, editTimeStamp, handleDelete, handleEdit,
}) => {
  const classes = useStyles();
  return (
    <Grid container className={classes.root}>
      <Grid item container className={classes.noteHeader}>
        <Grid item xs={6}>
          <Typography variant="s4sNoteHeader">{formatDate(editTimeStamp)}</Typography>
        </Grid>
        <Grid item container xs={6}>
          <Grid item xs={6} align="right">
            <Typography variant="s4sNoteHeaderButton" onClick={handleEdit}>EDIT</Typography>
          </Grid>
          <Grid item xs={6} align="right">
            <Typography variant="s4sNoteHeaderButton" onClick={handleDelete}>DELETE</Typography>
          </Grid>
        </Grid>
      </Grid>
      <Grid item>
        <Typography variant="s4sNoteText">{noteText}</Typography>
      </Grid>
    </Grid>
  );
};

const EditingNote = ({
  noteId, noteText, editTimeStamp, handleSave,
}) => {
  const [text, setText] = useState(noteText);
  const classes = useStyles();
  return (
    <div style={{ marginBottom: '20px' }}>
      <div className={classes.noteHeader}>
        <Typography variant="s4sNoteHeader">{formatDate(editTimeStamp)}</Typography>
      </div>
      <TextField
        className={classes.editTextField}
        id={`editing-note-${noteId}`}
        variant="outlined"
        size="small"
        fullWidth
        multiline
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <Button variant="contained" disableElevation size="small" onClick={() => handleSave(noteId, 'save', text)}>Save</Button>
    </div>
  );
};

const NoteField = ({
  noteId, noteText, editTimeStamp, isEditing, handleDelete, handleEdit, handleSave,
}) => {
  if (isEditing) {
    return (
      <EditingNote
        noteId={noteId}
        noteText={noteText}
        editTimeStamp={editTimeStamp}
        handleSave={handleSave}
      />
    );
  }
  return (
    <CompletedNote
      noteText={noteText}
      editTimeStamp={editTimeStamp}
      handleDelete={handleDelete}
      handleEdit={handleEdit}
    />
  );
};

export default NoteField;
