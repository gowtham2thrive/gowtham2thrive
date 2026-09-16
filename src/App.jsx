import useStore from './store/useStore';
import useDeviceDetect from './hooks/useDeviceDetect';
import RoleSelection from './components/RoleSelection';
import StudentPortfolio from './components/pages/StudentPortfolio';
import EntrepreneurPortfolio from './components/pages/EntrepreneurPortfolio';

function App() {
  const selectedRole = useStore((s) => s.selectedRole);

  // Initialize device detection
  useDeviceDetect();

  // Phase 1: Role selection (if no role stored)
  if (!selectedRole) {
    return <RoleSelection />;
  }

  // Phase 2: Selected portfolio — direct, seamless transition from portal
  return selectedRole === 'student' ? (
    <StudentPortfolio />
  ) : (
    <EntrepreneurPortfolio />
  );
}

export default App;
