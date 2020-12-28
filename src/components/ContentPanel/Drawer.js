import React from 'react';
import ReactDOM from 'react-dom';
import clsx from 'clsx';
import { makeStyles } from '@material-ui/core/styles';
import Drawer from '@material-ui/core/Drawer';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import { atom, useRecoilState, useRecoilValue } from 'recoil';

const drawerWidth = 420;

const useStyles = makeStyles((theme) => ({
  title: {
    // flexGrow: 1,
  },
  hide: {
    display: 'none',
  },
  contentBody: {
    padding: '8px',
  },
  rootOpen: {
    transition: theme.transitions.create(['width', 'minWidth'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
      // easing: theme.transitions.easing.easeOut,
      // duration: theme.transitions.duration.enteringScreen,
    }),
    width: drawerWidth,
    minWidth: drawerWidth,
    // backgroundColor: 'green',
  },
  rootClosed: {
    transition: theme.transitions.create(['width', 'minWidth'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.leavingScreen,
      // easing: theme.transitions.easing.easeOut,
      // duration: theme.transitions.duration.enteringScreen
    }),
    width: 0,
    minWidth: 0,
  },
  drawer: {
    display: 'flex',
    flexShrink: 0,
  },
  drawerPaper: {
    position: 'relative',
    width: drawerWidth,
  },
  drawerHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(0, 1),
    // necessary for content to be below app bar
    ...theme.mixins.toolbar,
    justifyContent: 'flex-start',
  },
  content: {
    display: 'flex',
    flexGrow: 1,
    padding: theme.spacing(3),
    // transition: theme.transitions.create('margin', {
    //   easing: theme.transitions.easing.sharp,
    //   duration: theme.transitions.duration.leavingScreen,
    // }),
    // marginRight: -drawerWidth,
  },
  contentShift: {
    display: 'flex',
    // transition: theme.transitions.create('margin', {
    //   easing: theme.transitions.easing.easeOut,
    //   duration: theme.transitions.duration.enteringScreen,
    // }),
    // marginRight: 0,
  },
}));

export const defaultDrawerOpenState = atom({
  key: 'drawerOpenState', // unique ID (with respect to other atoms/selectors)
  default: true, // default value (aka initial value)
});

export const MenuButton = () => {
  const classes = useStyles();
  const [open, setOpen] = useRecoilState(defaultDrawerOpenState);
  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const menuButton = (
    <div>
      <Typography variant="h6" noWrap className={classes.title}>
        {/* Title Here? */}
      </Typography>
      <IconButton
        color="inherit"
        aria-label="open drawer"
        edge="end"
        onClick={handleDrawerOpen}
        className={clsx(open && classes.hide)}
      >
        <MenuIcon />
      </IconButton>
    </div>
  );

  const detailsRightTarget = document.getElementById('details-right');
  if (detailsRightTarget) {
    return ReactDOM.createPortal(menuButton, detailsRightTarget);
  }
  return menuButton;
};

export const DrawerPortal = ({ children }) => {
  const classes = useStyles();
  const drawerOpen = useRecoilValue(defaultDrawerOpenState);
  // const handleDrawerClose = () => {
  //   setOpen(false);
  // };

  const drawer = (
    <Drawer
      className={classes.drawer}
      variant="persistent"
      anchor="right"
      open={drawerOpen}
      classes={{
        root: drawerOpen ? classes.rootOpen : classes.rootClosed,
        paper: classes.drawerPaper,
      }}
      SlideProps={{
        // direction: 'down'
      }}
    >
      <Divider />
      <div className={classes.contentBody}>
        {children}
      </div>
    </Drawer>
  );

  const detailsRightTarget = document.getElementById('details-right');
  if (detailsRightTarget) {
    return ReactDOM.createPortal(drawer, detailsRightTarget);
  }
  return drawer;
};

export default function PersistentDrawerRight({ open, children }) {
  return (<DrawerPortal>{ children }</DrawerPortal>);
}
