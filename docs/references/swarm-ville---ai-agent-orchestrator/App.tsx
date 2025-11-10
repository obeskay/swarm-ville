import React from 'react';
import VirtualOffice from './components/VirtualOffice';
import GeneratorPanel from './components/GeneratorPanel';
import GameHUD from './components/GameHUD';
import GameNotifications from './components/GameNotifications';
import AgentSpawner from './components/AgentSpawner';

function App() {
  const styles: { [key: string]: React.CSSProperties } = {
    appContainer: { display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#282c34', color: 'white', fontFamily: 'sans-serif' },
    appHeader: { padding: '1rem', borderBottom: '1px solid #444' },
    appTitle: { margin: 0, textAlign: 'center' },
    mainContent: { display: 'flex', flex: 1, overflow: 'hidden' },
    leftPanel: { width: '350px', padding: '1rem', borderRight: '1px solid #444', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' },
    centerPanel: { flex: 1, position: 'relative' },
    rightPanel: { width: '300px', padding: '1rem', borderLeft: '1px solid #444', overflowY: 'auto' },
  };

  return (
    <div className="app-container" style={styles.appContainer}>
      <header className="app-header" style={styles.appHeader}>
        <h1 style={styles.appTitle}>AI Swarm Collaboration Space</h1>
      </header>
      <main className="main-content" style={styles.mainContent}>
        <div className="left-panel" style={styles.leftPanel}>
          <GeneratorPanel />
          <AgentSpawner />
        </div>
        <div className="center-panel" style={styles.centerPanel}>
          <VirtualOffice />
        </div>
        <div className="right-panel" style={styles.rightPanel}>
          <GameHUD />
        </div>
      </main>
      <GameNotifications />
    </div>
  );
}

export default App;
