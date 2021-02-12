import React from 'react';
import { useRecoilValue } from 'recoil';
import ProviderRollup from './ProviderRollup';
import ProviderToggle from './ProviderToggle';
import { activeProvidersState } from '../../recoil';

const ProviderFilter = () => {
  const [isExpanded, setExpanded] = React.useState(true);
  const activeProviders = useRecoilValue(activeProvidersState);

  return (
    <div className="selector-set">
      <ProviderRollup
        isExpanded={isExpanded}
        expansionFn={() => setExpanded(!isExpanded)}
      />
      { isExpanded && Object.keys(activeProviders)
        .sort()
        .map((prov) => (
          <ProviderToggle
            key={prov}
            providerName={prov}
          />
        ))}
    </div>
  );
};

export default ProviderFilter;
