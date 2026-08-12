import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState("");

const [showTaskForm, setShowTaskForm] = useState(false);

const [newTask, setNewTask] = useState({
  title: "",
  description: "",
  status: "todo",
  priority: "medium",
  dueDate: "",
});
  
const handleCreateTask = async (event) => {
  event.preventDefault();

  try {
    const token = localStorage.getItem("token");

    const response = await axios.post(
      "http://localhost:5000/api/tasks",
      newTask,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setTasks((currentTasks) => [
      response.data.task,
      ...currentTasks,
    ]);

    setNewTask({
      title: "",
      description: "",
      status: "todo",
      priority: "medium",
      dueDate: "",
    });

    setShowTaskForm(false);
    setError("");
  } catch (err) {
    console.error(err);
    setError("Unable to create task");
  }
};

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
          <button
            className="add-task-button"
            onClick={() => setShowTaskForm(true)}
          >
            + Add Task
          </button>
        </div>

        {showTaskForm && (
  <form className="task-form" onSubmit={handleCreateTask}>
    <h3>Add Task</h3>

    <label>
      Task title
      <input
        type="text"
        value={newTask.title}
        onChange={(event) =>
          setNewTask({
            ...newTask,
            title: event.target.value,
          })
        }
        required
      />
    </label>

    <label>
      Description
      <textarea
        value={newTask.description}
        onChange={(event) =>
          setNewTask({
            ...newTask,
            description: event.target.value,
          })
        }
      />
    </label>

    <label>
      Status
      <select
        value={newTask.status}
        onChange={(event) =>
          setNewTask({
            ...newTask,
            status: event.target.value,
          })
        }
      >
        <option value="todo">To Do</option>
        <option value="in-progress">In Progress</option>
        <option value="done">Done</option>
      </select>
    </label>

    <label>
      Priority
      <select
        value={newTask.priority}
        onChange={(event) =>
          setNewTask({
            ...newTask,
            priority: event.target.value,
          })
        }
      >
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>
    </label>

    <label>
      Due date
      <input
        type="date"
        value={newTask.dueDate}
        onChange={(event) =>
          setNewTask({
            ...newTask,
            dueDate: event.target.value,
          })
        }
      />
    </label>

    <div className="form-actions">
      <button type="submit">
        Create Task
      </button>

      <button
        type="button"
        onClick={() => setShowTaskForm(false)}
      >
        Cancel
      </button>
    </div>
  </form>
        )}      
        
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