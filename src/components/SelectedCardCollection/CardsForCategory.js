import React, { useState } from 'react';
import { string } from 'prop-types';
import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Typography from '@material-ui/core/Typography';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import { makeStyles } from '@material-ui/core/styles';

import { useRecoilValue } from 'recoil';
import RecordCard from '../cards/RecordCard';
import { filteredActiveCollectionState, resourcesState } from '../../recoil';

const useStyles = makeStyles((theme) => ({
  root: {
    width: 390,
  },
  selected: {
    backgroundColor: theme.palette.tile.selected,
  },
  last: {
    backgroundColor: theme.palette.tile.last,
  },
}));

const CategorySubtypeAccordion = ({
  records, categoryLabel, subtypeLabel, categorySubtype,
}) => {
  const { hasLastAdded, collectionUuids } = categorySubtype;
  if (collectionUuids.length === 0) {
    return null;
  }

  const classes = useStyles();
  const summaryLabel = `${categoryLabel} - ${subtypeLabel}`;
  const [expanded, setExpanded] = useState(hasLastAdded);

  const accordionStyle = hasLastAdded ? classes.last : classes.selected;

  return (
    <Accordion
      className={`${classes.root} ${accordionStyle}`}
      elevation={0}
      expanded={expanded}
      TransitionProps={{ unmountOnExit: true }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        onClick={() => setExpanded(!expanded)}
      >
        {summaryLabel}
      </AccordionSummary>
      <AccordionDetails>
        {
          collectionUuids.map((uuid) => (
            <RecordCard
              key={`record-card-${uuid}`}
              recordId={uuid}
              records={records}
            />
          ))
        }
      </AccordionDetails>
    </Accordion>
  );
};

const CardsForCategory = ({ categoryLabel }) => {
  const resources = useRecoilValue(resourcesState);
  const filteredActiveCollection = useRecoilValue(filteredActiveCollectionState);

  const { records } = resources;
  const category = filteredActiveCollection[categoryLabel];
  if (!category || category.filteredCollectionCount === 0) {
    return null;
  }
  return (
    <div
      key={categoryLabel}
    >
      <Typography
        variant="card-list-category-header"
      >
        <Typography
          variant="card-list-category-label"
        >
          {categoryLabel}
        </Typography>
        <Typography
          variant="card-list-category-count"
        >
          [{`${category.filteredCollectionCount} of ${category.totalCount}`}] {/* eslint-disable-line react/jsx-one-expression-per-line */}
        </Typography>
      </Typography>
      {
        Object.entries(category.subtypes)
          .sort(([subtype1], [subtype2]) => ((subtype1 < subtype2) ? -1 : 1))
          .map(([displayCoding, categorySubtype]) => (
            <CategorySubtypeAccordion
              key={displayCoding}
              records={records}
              categoryLabel={categoryLabel}
              subtypeLabel={displayCoding}
              categorySubtype={categorySubtype}
            />
          ))
      }
    </div>
  );
};

CardsForCategory.propTypes = {
  categoryLabel: string.isRequired,
};

export default CardsForCategory;
