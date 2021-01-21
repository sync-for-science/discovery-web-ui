import React from 'react'
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import { format } from 'date-fns';

const useStyles = makeStyles((theme) => ({
  highlight: {
    backgroundColor: '#d78c14', // add this color to theme
  }
}));

const BenefitCardBody = ({fieldsData}) => {
  const classes = useStyles()

  const claimDisplay = fieldsData.type.coding[0].display
  const periodDisplay = `${format(new Date(fieldsData.billablePeriod.start), 'MMM d, y')} - ${format(new Date(fieldsData.billablePeriod.end), 'MMM d, y')}`
  const totalCostDisplay = `${fieldsData.totalCost.value.toFixed(2)} ${fieldsData.totalCost.code}`
  const totalBenefitDisplay = fieldsData.totalBenefit || 'unknown'
  const roleDisplay = fieldsData.careTeam[0].role.coding[0].display

  const renderContainedResource = (containedResource, i) => {
    switch(containedResource.resourceType) {
      case 'Coverage':
        return (
            <React.Fragment key={i}>
              <Grid item xs={4}><Typography variant="body2">COVERAGE</Typography></Grid>
              <Grid item xs={8}><Typography variant="body2">{containedResource.type.text}</Typography></Grid>
            </React.Fragment>
          )
      case 'ReferralRequest':
        return (
            <React.Fragment key={i}>
              <Grid item xs={4}><Typography variant="body2">REFERRAL</Typography></Grid>
              <Grid item xs={8}><Typography variant="body2">{containedResource.status}</Typography></Grid>
            </React.Fragment>
          )
      default:
        // ???? is a reference to Const.unknownValue which lives in utils.js. We'll want a way to handle unknown values
        return (
            <React.Fragment key={i}>
              <Grid item xs={4}><Typography variant="body2">{containedResource.resourceType}</Typography></Grid>
              <Grid item xs={8}><Typography variant="body2">????</Typography></Grid>
            </React.Fragment>
          )
    }
  }

  const renderContained = () => {
    return fieldsData.contained.map((containedResource, i) => renderContainedResource(containedResource, i))
  }

  return (
    <>
      <Grid item xs={4}><Typography variant="body2">CLAIM TYPE</Typography></Grid>
      <Grid item xs={8}><Typography variant="body2" className={classes.highlight}>{claimDisplay}</Typography></Grid>
      <Grid item xs={4}><Typography variant="body2">PERIOD</Typography></Grid>
      <Grid item xs={8}><Typography variant="body2">{periodDisplay}</Typography></Grid>
      <Grid item xs={4}><Typography variant="body2">TOTAL COST</Typography></Grid>
      <Grid item xs={8}><Typography variant="body2">{totalCostDisplay}</Typography></Grid>
      <Grid item xs={4}><Typography variant="body2">TOTAL BENEFIT</Typography></Grid>
      <Grid item xs={8}><Typography variant="body2">{totalBenefitDisplay}</Typography></Grid>
      <Grid item xs={4}><Typography variant="body2">PROVIDER</Typography></Grid>
      <Grid item xs={8}><Typography variant="body2">{fieldsData.provider}</Typography></Grid>
      <Grid item xs={4}><Typography variant="body2">STATUS</Typography></Grid>
      <Grid item xs={8}><Typography variant="body2">{fieldsData.status}</Typography></Grid>
      <Grid item xs={4}><Typography variant="body2">ROLE</Typography></Grid>
      <Grid item xs={8}><Typography variant="body2">{roleDisplay}</Typography></Grid>
      {renderContained()}
    </>
  )
}

export default BenefitCardBody