import React from 'react';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(() => ({
  highlight: {
    display: 'block',
    padding: '4px',
    backgroundColor: '#d78c14', // add this color to theme
  },
}));

const CardBodyField = ({
  dependency, label, value, highlight = false,
}) => {
  const classes = useStyles();
  const highlightStyle = highlight ? classes.highlight : '';

  if (dependency) {
    return (
      <>
        <Grid item xs={4}><Typography variant="s4sLabel">{label}</Typography></Grid>
        <Grid item xs={8}><Typography className={highlightStyle} variant="s4sValueText">{value}</Typography></Grid>
      </>
    );
  }

  return null;
};

export default CardBodyField;
