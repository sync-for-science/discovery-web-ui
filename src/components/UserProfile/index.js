import React from 'react';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import AccountCircleIcon from '@material-ui/icons/AccountCircle';
import { useRecoilValue } from 'recoil';
import { formatPatientName } from '../../fhirUtil.js';
import { patientRecord } from '../../recoil';

const UserProfile = () => {
  const patient = useRecoilValue(patientRecord);

  const {
    data: {
      name = {},
    } = {},
  } = patient;

  return (
    <IconButton>
      <AccountCircleIcon color="secondary" />
      <Typography variant="user-profile">{formatPatientName(name)}</Typography>
    </IconButton>
  );
};

export default UserProfile;
