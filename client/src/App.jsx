import "./App.css";

function App() {
  return (
    <div className="app">
      <header className="topbar">
        <h1>Kanban Board</h1>
        <div className="user-info">Test User</div>
      </header>

      <main className="dashboard">
        <div className="dashboard-header">
          <h2>My Board</h2>
          <button className="add-task-button">+ Add Task</button>
        </div>

        <div className="board">
          <section className="column">
            <h3>To Do</h3>
          </section>

          <section className="column">
            <h3>In Progress</h3>
          </section>

          <section className="column">
            <h3>Done</h3>
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;