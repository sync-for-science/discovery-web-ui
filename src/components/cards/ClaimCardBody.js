import React from 'react'
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { format } from 'date-fns';

const ClaimCardBody = ({fieldsData}) => {
  const periodDisplay = `${format(new Date(fieldsData.billablePeriod.start), 'MMM d, y')} - ${format(new Date(fieldsData.billablePeriod.end), 'MMM d, y')}`
  const displayTotal = `${fieldsData.total.value.toFixed(2)} ${fieldsData.total.code}`
  return (
    <>
      <Grid item xs={4}><Typography variant="body2">PERIOD</Typography></Grid>
      <Grid item xs={8}><Typography variant="body2">{periodDisplay}</Typography></Grid>
      <Grid item xs={4}><Typography variant="body2">TOTAL</Typography></Grid>
      <Grid item xs={8}><Typography variant="body2">{displayTotal}</Typography></Grid>
      <Grid item xs={4}><Typography variant="body2">PROVIDER</Typography></Grid>
      <Grid item xs={8}><Typography variant="body2">{fieldsData.provider}</Typography></Grid>
      <Grid item xs={4}><Typography variant="body2">STATUS</Typography></Grid>
      <Grid item xs={8}><Typography variant="body2">{fieldsData.status}</Typography></Grid>
      <Grid item xs={4}><Typography variant="body2">USE</Typography></Grid>
      <Grid item xs={8}><Typography variant="body2">{fieldsData.use}</Typography></Grid>
    </>
  )
}

export default ClaimCardBody