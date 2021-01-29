import React, { useEffect, useRef, useState } from 'react';
import { useRecoilState } from 'recoil';
import CardActions from '@material-ui/core/CardActions';
import Button from '@material-ui/core/Button';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Collapse from '@material-ui/core/Collapse';
import CardContent from '@material-ui/core/CardContent';
import TextField from '@material-ui/core/TextField';
import { makeStyles } from '@material-ui/core/styles';
import { notesState } from '../../recoil';
import NoteField from '../cards/NoteField';

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

const NotesEditor = ({ recordId, data }) => {
  const classes = useStyles();
  const [expanded, setExpanded] = useState(false);
  const [displayNotes, setDisplayNotes] = useState([]);
  const [recordNotesState, setRecordsNotesState] = useRecoilState(notesState);

  const noteInput = useRef(null);

  const onSaveNote = () => {
    const newRecordNotes = { ...recordNotesState };

    if (!newRecordNotes[data.id]) {
      newRecordNotes[data.id] = {};
    }
    const newDate = (new Date()).toISOString();
    const newNote = {};
    newNote[newDate] = { noteText: noteInput.current.value, editTimeStamp: newDate, isEditing: false };
    newRecordNotes[data.id] = { ...newRecordNotes[data.id], ...newNote };

    setRecordsNotesState(
      newRecordNotes,
    );
    noteInput.current.value = '';
  };

  const handleNoteAction = (noteId, action, text = null) => {
    const newRecordNotesState = { ...recordNotesState };
    const newRecordNotes = { ...newRecordNotesState[data.id] };
    const newRecordNote = { ...newRecordNotes[noteId] };

    switch (action) {
      case 'delete':
        delete newRecordNotes[noteId];
        if (Object.keys(newRecordNotes).length > 0) {
          newRecordNotesState[data.id] = newRecordNotes;
        } else {
          delete newRecordNotesState[data.id];
        }
        break;
      case 'edit':
        newRecordNote.isEditing = true;
        newRecordNotes[noteId] = newRecordNote;
        newRecordNotesState[data.id] = newRecordNotes;
        break;
      case 'save':
        newRecordNote.noteText = text;
        newRecordNote.isEditing = false;
        newRecordNote.editTimeStamp = (new Date()).toISOString();
        newRecordNotes[noteId] = newRecordNote;
        newRecordNotesState[data.id] = newRecordNotes;
        break;
      default:
        break;
    }

    setRecordsNotesState(newRecordNotesState);
  };

  useEffect(() => {
    const recordSpecificNotes = recordNotesState?.[data.id];

    let renderedNotes = [];
    if (recordSpecificNotes) {
      renderedNotes = Object.keys(recordSpecificNotes)?.sort().map((noteId) => {
        const { noteText, editTimeStamp, isEditing } = recordSpecificNotes[noteId];
        return (
          <NoteField
            key={noteId}
            noteId={noteId}
            noteText={noteText}
            editTimeStamp={editTimeStamp}
            isEditing={isEditing}
            handleDelete={() => handleNoteAction(noteId, 'delete')}
            handleEdit={() => handleNoteAction(noteId, 'edit')}
            handleSave={handleNoteAction}
          />
        );
      });
    }

    setDisplayNotes(renderedNotes);
  }, [recordNotesState, setDisplayNotes]);

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
          {displayNotes}
          <TextField
            className={classes.noteField}
            id={`note-entry-${data.id}`}
            placeholder="New Note"
            variant="outlined"
            size="small"
            fullWidth
            inputRef={noteInput}
          />
          <Button variant="contained" disableElevation size="small" onClick={onSaveNote}>Add Note</Button>
        </CardContent>
      </Collapse>
    </>
  );
};

export default React.memo(NotesEditor);
