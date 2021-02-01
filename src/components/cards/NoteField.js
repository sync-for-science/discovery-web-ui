import React, { useRef, useState } from 'react';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import ReactMarkdown from 'react-markdown';

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
  noteText, lastUpdated, handleDeleteNote, handleSetEditingMode,
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
            <Typography variant="s4sNoteHeaderButton" onClick={handleSetEditingMode}>EDIT</Typography>
          </Grid>
          <Grid item xs={6} align="right">
            <Typography variant="s4sNoteHeaderButton" onClick={handleDeleteNote}>DELETE</Typography>
          </Grid>
        </Grid>
      </Grid>
      <Grid item>
        <Typography variant="s4sNoteText"><ReactMarkdown>{noteText}</ReactMarkdown></Typography>
      </Grid>
    </Grid>
  );
};

const NoteField = ({
  noteId, noteData, updateOrCreateNote,
}) => {
  const classes = useStyles();
  const noteInputRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleInputEscapeBlur = (event) => {
    if (event.keyCode === 27) {
      noteInputRef.current.blur();
      setIsEditing(false);
    }
  };

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
          onKeyDown={handleInputEscapeBlur}
        />
        <Button variant="contained" disableElevation size="small" onClick={handleAddNewNote}>Add Note</Button>
      </>
    );
  }

  // Otherwise, this is an existing note:
  const { noteText, lastUpdated } = noteData;

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
          onKeyDown={handleInputEscapeBlur}
          defaultValue={noteText}
          autoFocus
        />
        <Button variant="contained" disableElevation size="small" onClick={handleUpdateNote}>Save</Button>
      </div>
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

  const handleSetEditingMode = (_event) => {
    setIsEditing(true);
  };

  return (
    <CompletedNote
      noteText={noteText}
      lastUpdated={lastUpdated}
      handleDeleteNote={handleDeleteNote}
      handleSetEditingMode={handleSetEditingMode}
    />
  );
};

export default React.memo(NoteField);
