import { G4Provider } from './context/G4Context';
import { PageRouter } from './PageRouter';

export function G4ExperimentComponent({ userContext, initialPageId, options }) {
  const flowContext = options?.flowContext;

  return (
    <G4Provider
      initialPageId={initialPageId}
      userContext={userContext}
      flowContext={flowContext}
    >
      <PageRouter />
    </G4Provider>
  );
}

export default G4ExperimentComponent;
