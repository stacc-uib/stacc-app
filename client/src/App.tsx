import AppShell from './app/AppShell';
import { TradesProvider } from './features/trades/TradesContext';

function App() {
  return (
    <TradesProvider>
      <AppShell />
    </TradesProvider>
  );
}

export default App;
