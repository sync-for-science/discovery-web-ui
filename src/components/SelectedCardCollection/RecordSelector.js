import React from 'react';
import { array, string } from 'prop-types';
import { useRecoilValue, useRecoilState } from 'recoil';
import { activeCollectionState, lastRecordsClickedState } from '../../recoil';

const showCount = (count) => {
  if (count > 1) {
    return ` [${count}]`;
  }
  return null;
};

const RecordSelector = ({ label, uuids }) => {
  const [activeCollection, setActiveCollection] = useRecoilState(activeCollectionState);
  const lastUuidsClicked = useRecoilValue(lastRecordsClickedState);

  // console.info('activeCollection: ', JSON.stringify(activeCollection, null, '  '));
  // console.info('lastUuidsClicked: ', JSON.stringify(lastUuidsClicked, null, '  '));

  const { uuids: activeUuids } = activeCollection;
  const hasLastClickedUuid = uuids.reduce((acc, uuid) => lastUuidsClicked[uuid] || acc, false);
  const hasActiveUuid = hasLastClickedUuid || uuids.reduce((acc, uuid) => activeUuids[uuid] || acc, false);
  // console.info('hasActiveUuid: ', hasActiveUuid);
  // console.info('hasLastClickedUuid: ', hasLastClickedUuid);

  const cssClass = hasLastClickedUuid ? 'tile-standard-last' : (hasActiveUuid ? 'tile-standard-selected' : 'tile-standard');

  const handleClick = () => {
    const resetUuids = uuids.reduce((acc, uuid) => ({ ...acc, [uuid]: !hasActiveUuid }), {});
    setActiveCollection(resetUuids);
  };

  return (
    <button
      className={cssClass}
      onClick={handleClick}
    >
      {label}
      {showCount(uuids.length)}
    </button>
  );
};

RecordSelector.propTypes = {
  // displayCoding: shape({
  //   code: string.isRequired,
  //   display: string.isRequired,
  // }).isRequired,
  label: string.isRequired,
  uuids: array.isRequired,
};

export default React.memo(RecordSelector);
