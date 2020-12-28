import React from 'react';
import { node, string } from 'prop-types';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import { makeStyles } from '@material-ui/core/styles';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown/with-html';

import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import OutboundLink from './OutboundLink';

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

const Modal = ({ i18nKey, icon, children }) => {
  const classes = useStyles();
  const { t } = useTranslation();
  const [modalOpen, setOpen] = React.useState(false);

  const handleModalOpen = () => {
    setOpen(true);
  };

  const handleModalClose = () => {
    setOpen(false);
  };

  const modalId = `${i18nKey}-modal`;
  const title = t(`${i18nKey}.title`);
  const body = t(`${i18nKey}.body`);
  const tooltip = t(`${i18nKey}.tooltip`);

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
        disableBackdropClick={false}
        disableEscapeKeyDown={false}
        open={modalOpen}
        onClose={handleModalClose}
        className={classes.root}
      >
        <DialogActions>
          <DialogTitle>
            {title}
          </DialogTitle>
          <Button
            variant="text"
            onClick={handleModalClose}
          >
            Close
          </Button>
        </DialogActions>
        <DialogContent>
          <ReactMarkdown
            source={body}
            escapeHtml={false}
            renderers={{ link: OutboundLink }}
          />
          { children }
        </DialogContent>
      </Dialog>
    </>
  );
};

Modal.propTypes = {
  i18nKey: string.isRequired,
  icon: node,
  children: node,
};

Modal.defaultProps = {
  icon: null,
  children: null,
};

export default Modal;
