import React from 'react';
import { string } from 'prop-types';
import { useRecoilState } from 'recoil';
import { makeStyles } from '@material-ui/core/styles';
import { collectionNotes } from '../../recoil';
import NoteField from '../cards/NoteField';

const useStyles = makeStyles(() => ({
  newNote: {
    marginBottom: '10px',
  },
}));

const NotesEditor = ({ activeCollectionId }) => {
  const classes = useStyles();
  const [notesForThisCollection, createOrEditCollectionNote] = useRecoilState(collectionNotes(activeCollectionId));

  return (
    <>
      <div className={classes.newNote}>
        <NoteField
          noteId="add-note"
          noteData={null}
          updateOrCreateNote={createOrEditCollectionNote}
        />
      </div>
      {Object.entries(notesForThisCollection).map(([creationTime, noteData]) => (
        <NoteField
          key={creationTime}
          noteId={creationTime}
          noteData={noteData}
          updateOrCreateNote={createOrEditCollectionNote}
        />
      ))}
    </>
  );
};

NotesEditor.prototype = {
  activeCollectionId: string,
};

export default React.memo(NotesEditor);
