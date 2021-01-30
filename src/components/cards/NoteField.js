import React, { useRef, useState } from 'react';
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
  noteField: {
    marginBottom: 10,
  },
}));

const CompletedNote = ({
  noteText, lastUpdated, handleDeleteNote, handleEdit,
}) => {
  const classes = useStyles();
  // TODO: Use <Button /> instead of <Typography />, and style Button variant?
  return (
    <Grid container className={classes.root}>
      <Grid item container className={classes.noteHeader}>
        <Grid item xs={6}>
          <Typography variant="s4sNoteHeader">{formatDate(lastUpdated)}</Typography>
        </Grid>
        <Grid item container xs={6}>
          <Grid item xs={6} align="right">
            <Typography variant="s4sNoteHeaderButton" onClick={handleEdit}>EDIT</Typography>
          </Grid>
          <Grid item xs={6} align="right">
            <Typography variant="s4sNoteHeaderButton" onClick={handleDeleteNote}>DELETE</Typography>
          </Grid>
        </Grid>
      </Grid>
      <Grid item>
        <Typography variant="s4sNoteText">{noteText}</Typography>
      </Grid>
    </Grid>
  );
};

// TODO: support markdown for notes? (eg: support multiline):
const EditingNote = ({
  noteId, lastUpdated, handleUpdateNote, noteInputRef,
}) => {
  const classes = useStyles();
  return (
    <div style={{ marginBottom: '20px' }}>
      <div className={classes.noteHeader}>
        <Typography variant="s4sNoteHeader">{formatDate(lastUpdated)}</Typography>
      </div>
      <TextField
        id={`editing-note-${noteId}`}
        placeholder="Edit Note"
        autoComplete="off"
        className={classes.editTextField}
        variant="outlined"
        size="small"
        fullWidth
        multiline
        inputRef={noteInputRef}
      />
      <Button variant="contained" disableElevation size="small" onClick={handleUpdateNote}>Save</Button>
    </div>
  );
};

const NoteField = ({
  noteId, noteData, updateOrCreateNote,
}) => {
  const classes = useStyles();
  const noteInputRef = useRef(null);

  // noteDate will be null:
  if (noteId === 'add-note') {
    const handleAddNewNote = (_event) => {
      // console.info('handleAddNewNote _event: ', _event);
      // console.info('handleAddNewNote noteInputRef.current.value: ', noteInputRef.current.value);
      updateOrCreateNote({
        noteText: noteInputRef.current.value,
      });
      // Reset the "Add New Note" field to be blank:
      noteInputRef.current.value = '';
    };

    return (
      <>
        <TextField
          placeholder="New Note"
          autoComplete="off"
          className={classes.noteField}
          variant="outlined"
          size="small"
          fullWidth
          multiline
          inputRef={noteInputRef}
        />
        <Button variant="contained" disableElevation size="small" onClick={handleAddNewNote}>Add Note</Button>
      </>
    );
  }

  // Otherwise, this is an existing note:
  const { noteText, lastUpdated } = noteData;

  // TODO: isEditing state
  const [isEditing, setIsEditing] = useState(false);

  // ...an existing note active for editing:
  if (isEditing) {
    const handleUpdateNote = (_event) => {
      // console.info('handleUpdateNote _event: ', _event);
      // console.info('handleUpdateNote noteInputRef.current.value: ', noteInputRef.current.value);
      updateOrCreateNote({
        noteId,
        noteText: noteInputRef.current.value,
      });
      setIsEditing(false);
    };
    return (
      <EditingNote
        noteId={noteId}
        noteText={noteText}
        lastUpdated={lastUpdated}
        handleUpdateNote={handleUpdateNote}
        noteInputRef={noteInputRef}
      />
    );
  }

  // ...an existing note that is _not_ active for editing:
  const handleDeleteNote = (_event) => {
    // console.info('handleDeleteNote _event: ', _event);
    updateOrCreateNote({
      noteId,
      noteText: null,
    });
  };

  return (
    <CompletedNote
      noteText={noteText}
      lastUpdated={lastUpdated}
      handleDeleteNote={handleDeleteNote}
      handleEdit={() => setIsEditing(true)}
    />
  );
};

export default NoteField;
