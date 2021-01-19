import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';

import { connectToResources } from '../../recoil';
import PersistentDrawerRight from '../ContentPanel/Drawer';

const useStyles = makeStyles({
  root: {
    // minWidth: 275,
  },
  title: {
    fontSize: 14,
  },
  pos: {
    marginBottom: 12,
  },
});

const RecordCard = ({ resource }) => {
  const classes = useStyles();
  const {
    // provider,
    // data,
    data: {
      // id,
      resourceType,
      // effectiveDateTime,
      itemDate,
    },
  } = resource;

  // if (id === 'f22de2b8-f549-416c-bea2-cdffe2585a65') {
  //   console.error('id: ', id);
  //   console.error('data: ', data);
  // }

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
  return normalized.map((r) => (<RecordCard resource={r} key={r.data.id} />));
};

const Collections = (props) => {
  const { loading, normalized } = props.resources;

  return (
    <div>
      <h3>COLLECTIONS</h3>
      <div>
        loading:
        { String(loading) }
      </div>
      <div className="collections-content">
        <pre>
          { JSON.stringify(normalized, null, '  ') }
        </pre>
      </div>
      <PersistentDrawerRight>
        <div className="card-list">
          <CardList
            normalized={normalized}
          />
        </div>
      </PersistentDrawerRight>
    </div>
  );
};

export default connectToResources(Collections);
