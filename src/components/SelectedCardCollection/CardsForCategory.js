import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  const classes = useStyles();
  const { hasLastAdded, collectionUuids } = categorySubtype;
  const summaryLabel = `${categoryLabel} - ${subtypeLabel}`;
  const [expanded, setExpanded] = useState(hasLastAdded);

  // console.log('expanded', summaryLabel, expanded)
  // console.log('categorySubtype', categorySubtype);
  
  if (collectionUuids.length === 0) {
    return null;
  }

  // const setDefaultExpanded = useCallback(() => {
  //   setExpanded(hasLastAdded)
  // }, [setExpanded, hasLastAdded])

  // useEffect(() => {
  //   if (collectionUuids.length === 0) {
  //     return null;
  //   }
  //   setDefaultExpanded()
  // }, [setDefaultExpanded, collectionUuids]);

  console.log('hasLastAdded', summaryLabel, hasLastAdded)
  console.log('expanded', summaryLabel, expanded)

  // useEffect(() => {
  //   if (hasLastAdded !== expanded) {
  //     setExpanded(hasLastAdded)
  //   }
  // }, [hasLastAdded, setExpanded])
  

  const accordionStyle = hasLastAdded ? classes.last : classes.selected;

  const categoryAccordion = useRef(null)
  console.log('categoryAccordion', categoryAccordion)
  // if (hasLastAdded) {
  //   categoryAccordion.current.scrollIntoView()
  // }
  return (
    <Accordion
      // defaultExpanded={hasLastAdded}
      className={`${classes.root} ${accordionStyle}`}
      elevation={0}
      expanded={expanded}
      
      ref={categoryAccordion}
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
  // console.info('category: ', JSON.stringify(category, null, '  '));
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
