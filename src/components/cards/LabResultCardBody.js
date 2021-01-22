import React from 'react'
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  highlight: {
    backgroundColor: '#d78c14', // add this color to theme
  }
}));

const LabResultCardBody = ({fieldsData}) => {
  const classes = useStyles()
  let valueField
  if( fieldsData.valueQuantity ) {
    const valueDisplay = `${fieldsData.valueQuantity.value.toFixed(1)} ${fieldsData.valueQuantity.unit}`
    valueField = (
      <>
        <Grid item xs={4}><Typography variant="body2">VALUE</Typography></Grid>
        <Grid item xs={8}><Typography variant="body2">{valueDisplay}</Typography></Grid>
      </>
    )
  } else if ( fieldsData.component ) {
    valueField = fieldsData.component.map((resource, i) => {
      const valueDisplay = `${resource.valueQuantity.value.toFixed(1)} ${resource.valueQuantity.code}`
      const label = resource.code.text.split(' ')[0].toUpperCase()
      return (
        <React.Fragment key={i}>
          <Grid item xs={4}><Typography variant="body2">{label}</Typography></Grid>
          <Grid item xs={8}><Typography variant="body2">{valueDisplay}</Typography></Grid>
        </React.Fragment>
      )
    })
  }

  return (
    <>
      <Grid item xs={4}><Typography variant="body2">MEASURE</Typography></Grid>
      <Grid item xs={8}><Typography variant="body2" className={classes.highlight}>{fieldsData.display}</Typography></Grid>
      {valueField}
      <Grid item xs={4}><Typography variant="body2">STATUS</Typography></Grid>
      <Grid item xs={8}><Typography variant="body2">{fieldsData.status}</Typography></Grid>
      <Grid item xs={4}><Typography variant="body2"></Typography></Grid>
      <Grid item xs={8}><Typography variant="body2">(Placeholder Graph)</Typography></Grid>
    </>
  )
}

export default LabResultCardBody