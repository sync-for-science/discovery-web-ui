import React, { useState } from 'react';
import { string } from 'prop-types';
import { useRecoilState } from 'recoil';
import CardActions from '@material-ui/core/CardActions';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Collapse from '@material-ui/core/Collapse';
import CardContent from '@material-ui/core/CardContent';
import { makeStyles } from '@material-ui/core/styles';
import { notesWithRecordId } from '../../recoil';
import NoteField from '../cards/NoteField';

const useStyles = makeStyles(() => ({
  cardActions: {
    padding: '0 10px',
  },
}));

const NotesEditor = ({ recordId }) => {
  const classes = useStyles();
  const [expanded, setExpanded] = useState(false);
  const [notesForThisRecord, updateOrCreateNote] = useRecoilState(notesWithRecordId(recordId));

  return (
    <>
      <CardActions disableSpacing className={classes.cardActions}>
        <Button color="primary" disableElevation size="small" onClick={() => setExpanded(!expanded)}>
          <Typography variant="s4sNoteHeader">Notes</Typography>
          <ExpandMoreIcon />
        </Button>
      </CardActions>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent>
          {Object.entries(notesForThisRecord).map(([creationTime, noteData]) => (
            <NoteField
              key={creationTime}
              noteId={creationTime}
              noteData={noteData}
              updateOrCreateNote={updateOrCreateNote}
            />
          ))}
          <NoteField
            noteId="add-note"
            noteData={null}
            updateOrCreateNote={updateOrCreateNote}
          />
        </CardContent>
      </Collapse>
    </>
  );
};

NotesEditor.prototype = {
  recordId: string.isRequired,
};

export default React.memo(NotesEditor);
