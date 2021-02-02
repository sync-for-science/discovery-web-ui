import React from 'react';
// import {
//   oneOf, shape, string,
// } from 'prop-types';
import IconButton from '@material-ui/core/IconButton';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import AccountCircleIcon from '@material-ui/icons/AccountCircle';
import { useRecoilValue } from 'recoil';
import { formatPatientName } from '../../fhirUtil.js';
import { patientRecord } from '../../recoil';
import { formatAge } from '../../util';

const ITEM_HEIGHT = 48;

const UserProfile = () => {
  const patient = useRecoilValue(patientRecord);
  // from MUI examples -- clicking particular links should close menu:
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const {
    data: {
      name = {},
      birthDate = '',
    } = {},
  } = patient;

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (e) => {
    const dataMenuItem = e.target.attributes['data-menu-item'];
    if (dataMenuItem) {
      setAnchorEl(null);
    }
  };

  const now = (new Date()).toISOString();
  const patientAge = birthDate && formatAge(birthDate, now, 'age ') || '';

  return (
    <>
      <IconButton
        onClick={handleClick}
        aria-label="User Menu"
        aria-controls="user-profile-menu"
        aria-haspopup="true"
      >
        <AccountCircleIcon />
      </IconButton>
      <Menu
        id="user-profile-menu"
        anchorEl={anchorEl}
        keepMounted
        open={open}
        onClose={handleClose}
        PaperProps={{
          style: {
            maxHeight: ITEM_HEIGHT * 4.5,
            // width: 250,
          },
        }}
      >
        <Card>
          <CardContent>
            <Typography component="div" noWrap>
              <b>{formatPatientName(name)}</b>
            </Typography>
            <Typography component="div" noWrap>
              {patientAge}
            </Typography>
            <Typography component="div" noWrap>
              <i>patient@email.whatevs</i>
            </Typography>
          </CardContent>
        </Card>
        <MenuItem onClick={handleMenuItemClick} data-menu-item="link-1">
          example link 1
        </MenuItem>
        <MenuItem onClick={handleMenuItemClick} data-menu-item="link-2">
          example link 2
        </MenuItem>
      </Menu>
    </>
  );
};

UserProfile.defaultProps = {
};

UserProfile.propTypes = {
};

export default UserProfile;
