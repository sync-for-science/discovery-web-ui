import React from 'react';
import { array, string } from 'prop-types';
import { useRecoilValue, useRecoilState } from 'recoil';
import { activeCollectionState } from '../../recoil';

const showCount = (count) => {
  if (count > 1) {
    return ` [${count}]`;
  }
  return null;
};

const RecordSelector = ({ label, uuids }) => {
  const [activeCollection, setActiveCollection] = useRecoilState(activeCollectionState);

  const { uuids: activeUuids, recentlyAddedUuids } = activeCollection;
  const hasActiveUuid = uuids.reduce((acc, uuid) => activeUuids[uuid] || acc, false);
  const hasLastClickedUuid = hasActiveUuid && uuids.reduce((acc, uuid) => recentlyAddedUuids[uuid] || acc, false);

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
  label: string.isRequired,
  uuids: array.isRequired,
};

export default React.memo(RecordSelector);
