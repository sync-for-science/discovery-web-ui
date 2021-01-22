import React from 'react'
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  highlight: {
    backgroundColor: '#d78c14', // add this color to theme
  }
}));

const ProcedureCardBody = ({fieldsData}) => {
  const classes = useStyles()
  return (
    <>
      <Grid item xs={4}><Typography variant="body2">Procedure</Typography></Grid>
    </>
  )
}

export default ProcedureCardBody