import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await axios.get(
          "http://localhost:5000/api/tasks",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setTasks(response.data.tasks);
      } catch (err) {
        console.error(err);
        setError("Unable to load tasks");
      }
    };

    fetchTasks();
  }, []);

  const todoTasks = tasks.filter((task) => task.status === "todo");

  const inProgressTasks = tasks.filter(
    (task) => task.status === "in-progress"
  );

  const doneTasks = tasks.filter((task) => task.status === "done");

  const renderTask = (task) => (
    <div className="task-card" key={task._id}>
      <h4>{task.title}</h4>

      {task.description && (
        <p>{task.description}</p>
      )}

      <span className="priority">
        {task.priority}
      </span>
    </div>
  );

  return (
    <div className="app">
      <header className="topbar">
        <h1>Kanban Board</h1>
        <div className="user-info">Test User</div>
      </header>

      <main className="dashboard">
        <div className="dashboard-header">
          <h2>My Board</h2>
          <button className="add-task-button">
            + Add Task
          </button>
        </div>

        {error && <p>{error}</p>}

        <div className="board">
          <section className="column">
            <h3>To Do</h3>
            {todoTasks.map(renderTask)}
          </section>

          <section className="column">
            <h3>In Progress</h3>
            {inProgressTasks.map(renderTask)}
          </section>

          <section className="column">
            <h3>Done</h3>
            {doneTasks.map(renderTask)}
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;