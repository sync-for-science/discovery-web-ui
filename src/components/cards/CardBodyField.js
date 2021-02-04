import React from 'react';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { string, bool } from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(() => ({
  root: {
    marginBottom: '2px',
  },
  highlight: {
    display: 'block',
    backgroundColor: '#fff', // disable, for now; if ever needed, add this color to theme
  },
}));

const CardBodyField = ({
  dependency, label, value, highlight = false, bold = false,
}) => {
  const classes = useStyles();
  const highlightStyle = highlight ? classes.highlight : '';
  const valueFontStyle = bold ? 's4sValueTextBold' : 's4sValueText';

  if (dependency) {
    return (
      <Grid item container className={classes.root}>
        <Grid item xs={4}><Typography variant="s4sLabel">{label}</Typography></Grid>
        <Grid item xs={8}><Typography className={highlightStyle} variant={valueFontStyle}>{value}</Typography></Grid>
      </Grid>
    );
  }

  return null;
};

CardBodyField.prototype = {
  dependency: string.isRequired,
  label: string.isRequired,
  value: string.isRequired,
  highlight: bool,
  bold: bool,
};

export default CardBodyField;
