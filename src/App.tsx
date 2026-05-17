import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { WelcomeScreen } from './components/Welcome/WelcomeScreen';
import { SchedulerScreen } from './components/Scheduler/SchedulerScreen';
import { AdminScreen } from './components/Admin/AdminScreen';
import { ConsoleScreen } from './components/Console/ConsoleScreen';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WelcomeScreen />} />
        <Route path="/scheduler" element={<SchedulerScreen />} />
        <Route path="/console" element={<ConsoleScreen />} />
        <Route path="/admin" element={<AdminScreen />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;