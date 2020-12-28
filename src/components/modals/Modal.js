import React from 'react';
import { node, string } from 'prop-types';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import { makeStyles } from '@material-ui/core/styles';
// import { useTranslation } from 'react-i18next';
// import ReactMarkdown from 'react-markdown/with-html';

import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import CloseIcon from '@material-ui/icons/Close';
// import OutboundLink from './OutboundLink';

const useStyles = makeStyles(() => ({
  root: {
    '& .MuiDialogActions-root': {
      justifyContent: 'space-between',
      padding: '8px 16px 8px 16px',
      '& .MuiDialogTitle-root': {
        padding: 0,
      },
    },
    '& .MuiDialogContent-root': {
      margin: '0 0 8px 0', // only on bottom
      padding: '0 16px 8px 16px',
    },
  },
}));

const Modal = ({
  modalId, icon, title, tooltip, children,
}) => {
  const classes = useStyles();
  const [modalOpen, setOpen] = React.useState(false);

  const handleModalOpen = () => {
    setOpen(true);
  };

  const handleModalClose = () => {
    setOpen(false);
  };

  const modalGraphicOrText = icon ? (
    <IconButton
      aria-controls={modalId}
      onClick={handleModalOpen}
      aria-label={title}
      aria-haspopup="true"
    >

      { icon }
    </IconButton>
  ) : (
    <a // eslint-disable-line jsx-a11y/anchor-is-valid
      role="button"
      href="#"
      onClick={handleModalOpen}
      aria-label={`Open ${title}`}
      aria-controls={modalId}
      aria-haspopup="true"
    >
      {title}
    </a>
  );

  const modalLauncher = !tooltip ? modalGraphicOrText : (
    <Tooltip
      title={tooltip}
    >
      { modalGraphicOrText }
    </Tooltip>
  );

  return (
    <>
      { modalLauncher }
      <Dialog
        id={modalId}
        fullWidth
        maxWidth="md" // 'lg' 'md' 'sm' 'xl' 'xs' false
        open={modalOpen}
        onClose={handleModalClose}
        className={classes.root}
      >
        <DialogActions>
          <DialogTitle>
            {title}
          </DialogTitle>
          <IconButton
            onClick={handleModalClose}
            aria-label="close"
            aria-controls={modalId}
          >
            <CloseIcon />
          </IconButton>
        </DialogActions>
        <DialogContent>
          { children }
        </DialogContent>
      </Dialog>
    </>
  );
};

Modal.propTypes = {
  modalId: string.isRequired,
  icon: node,
  title: string,
  tooltip: node,
  children: node,
};

Modal.defaultProps = {
  icon: null,
  title: '',
  tooltip: null,
  children: null,
};

export default React.memo(Modal);
