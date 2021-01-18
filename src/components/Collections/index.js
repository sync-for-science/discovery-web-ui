import React from 'react';
import PropTypes from 'prop-types';
import { atom, useRecoilState, useRecoilValue } from 'recoil';
import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';

import { resourcesState } from '../DiscoveryApp';
import PersistentDrawerRight from '../ContentPanel/Drawer';
// import FhirTransform from '../../FhirTransform';
// import { tryWithDefault } from '../../util';
// import { log } from '../../utils/logger';
import { normalizeResponseResources } from '../DiscoveryApp/Api';

const useStyles = makeStyles({
  root: {
    // minWidth: 275,
    border: '1px solid red',
    margin: '10px',
  },
  title: {
    fontSize: 14,
  },
  pos: {
    marginBottom: 12,
  },
});

const RecordCard = ({ resource }) => {
  console.error('resource: ', resource);
  const classes = {}; // useStyles();
  // const bull = <span className={classes.bullet}>•</span>;
  const {
    provider, data, data: {
      resourceType,
      effectiveDateTime,
      itemDate,
    },
  } = resource;

  // const fields = Object.entries(data).map(([k, v]) => {
  //   console.error(' k , v: ', k , v);
  //   return (
  //     <div>
  //       { k }: { JSON.stringify(v) }
  //     </div>
  //   );
  // });

  return (
    <Card
      className={classes.root}
      elevation={4}
      style={{
        margin: '10px',
        border: '1px solid red',
      }}
    >
      <CardContent>
        <Typography className={classes.title} color="textSecondary" gutterBottom>
          { resourceType }
        </Typography>
        <Typography className={classes.pos} color="textSecondary">
          { itemDate }
        </Typography>
        <Typography variant="body2" component="p" />
      </CardContent>
      <CardActions>
        <Button size="small">Annotate</Button>
      </CardActions>
    </Card>
  );
};

const CardList = ({ normalized }) => {
  if (!normalized) {
    return null;
  }

  return normalized.map((r) => <RecordCard resource={r} />);
};

const Collections = (props) => {
  const resources = useRecoilValue(resourcesState);

  console.error('resources: ', resources);
  let normalized;
  if ((resources && resources.data)) {
    console.error('xxx resources.data: ', (resources.data));

    normalized = normalizeResponseResources(resources.data);
    console.error('xxx normalized resources: ', normalized);

    console.error('xxx normalized resources[0]: ', JSON.stringify(normalized[0], null, '  '));
  }
  return (
    <div>
      <h3>COLLECTIONS</h3>
      <div className="collections-content">
        <pre>
          { JSON.stringify(normalized, null, '  ') }
        </pre>
      </div>
      <PersistentDrawerRight>
        <div className="card-list">
          <CardList
            // resources={resources}
            normalized={normalized}
          />
        </div>
      </PersistentDrawerRight>
    </div>
  );
};

export default React.memo(Collections);
