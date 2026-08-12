import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";
import {
  DragDropContext,
  Droppable,
  Draggable,
} from "@hello-pangea/dnd";
function App() {
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState("");

const [showTaskForm, setShowTaskForm] = useState(false);
const [editingTask, setEditingTask] = useState(null);
  
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

const renderTask = (task, index) => (
  <Draggable
    key={task._id}
    draggableId={task._id}
    index={index}
  >
    {(provided) => (
      <div
        className="task-card"
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
      >
        <h4>{task.title}</h4>

        {task.description && <p>{task.description}</p>}

        <span className="priority">
          {task.priority}
        </span>

        <div className="task-actions">
          <button
            type="button"
            onClick={() => setEditingTask(task)}
          >
            Edit
          </button>

          <button
            type="button"
            onClick={() => handleDeleteTask(task._id)}
          >
            Delete
          </button>
        </div>
      </div>
    )}
  </Draggable>
);

const handleDeleteTask = async (taskId) => {
  try {
    const token = localStorage.getItem("token");

    await axios.delete(
      `http://localhost:5000/api/tasks/${taskId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setTasks((currentTasks) =>
      currentTasks.filter((task) => task._id !== taskId)
    );

    setError("");
  } catch (err) {
    console.error(err);
    setError("Unable to delete task");
  }
};

const handleUpdateTask = async (event) => {
  event.preventDefault();

  try {
    const token = localStorage.getItem("token");

    const response = await axios.put(
      `http://localhost:5000/api/tasks/${editingTask._id}`,
      {
        title: editingTask.title,
        description: editingTask.description,
        status: editingTask.status,
        priority: editingTask.priority,
        dueDate: editingTask.dueDate || null,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task._id === editingTask._id
          ? response.data.task
          : task
      )
    );

    setEditingTask(null);
    setError("");
  } catch (err) {
    console.error(err);
    setError("Unable to update task");
  }
};
  
const handleDragEnd = async (result) => {
  const { destination, source, draggableId } = result;

  if (!destination) {
    return;
  }

  if (
    destination.droppableId === source.droppableId &&
    destination.index === source.index
  ) {
    return;
  }

  const task = tasks.find((task) => task._id === draggableId);

  if (!task) {
    return;
  }

  const previousStatus = task.status;
  const newStatus = destination.droppableId;

  setTasks((currentTasks) =>
    currentTasks.map((currentTask) =>
      currentTask._id === draggableId
        ? { ...currentTask, status: newStatus }
        : currentTask
    )
  );

  try {
    const token = localStorage.getItem("token");

    const response = await axios.put(
      `http://localhost:5000/api/tasks/${draggableId}`,
      {
        status: newStatus,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setTasks((currentTasks) =>
      currentTasks.map((currentTask) =>
        currentTask._id === draggableId
          ? response.data.task
          : currentTask
      )
    );

    setError("");
  } catch (err) {
    console.error(err);

    setTasks((currentTasks) =>
      currentTasks.map((currentTask) =>
        currentTask._id === draggableId
          ? { ...currentTask, status: previousStatus }
          : currentTask
      )
    );

    setError("Unable to move task");
  }
};

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

        {editingTask && (
  <form className="task-form" onSubmit={handleUpdateTask}>
    <h3>Edit Task</h3>

    <label>
      Task title
      <input
        type="text"
        value={editingTask.title}
        onChange={(event) =>
          setEditingTask({
            ...editingTask,
            title: event.target.value,
          })
        }
        required
      />
    </label>

    <label>
      Description
      <textarea
        value={editingTask.description}
        onChange={(event) =>
          setEditingTask({
            ...editingTask,
            description: event.target.value,
          })
        }
      />
    </label>

    <label>
      Status
      <select
        value={editingTask.status}
        onChange={(event) =>
          setEditingTask({
            ...editingTask,
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
        value={editingTask.priority}
        onChange={(event) =>
          setEditingTask({
            ...editingTask,
            priority: event.target.value,
          })
        }
      >
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>
    </label>

    <div className="form-actions">
      <button type="submit">
        Save Changes
      </button>

      <button
        type="button"
        onClick={() => setEditingTask(null)}
      >
        Cancel
      </button>
    </div>
  </form>
)}
        
        {error && <p>{error}</p>}


<DragDropContext onDragEnd={handleDragEnd}>
  <div className="board">
    <Droppable droppableId="todo">
      {(provided) => (
        <section
          className="column"
          ref={provided.innerRef}
          {...provided.droppableProps}
        >
          <h3>To Do</h3>

          {todoTasks.map((task, index) =>
            renderTask(task, index)
          )}

          {provided.placeholder}
        </section>
      )}
    </Droppable>

    <Droppable droppableId="in-progress">
      {(provided) => (
        <section
          className="column"
          ref={provided.innerRef}
          {...provided.droppableProps}
        >
          <h3>In Progress</h3>

          {inProgressTasks.map((task, index) =>
            renderTask(task, index)
          )}

          {provided.placeholder}
        </section>
      )}
    </Droppable>

    <Droppable droppableId="done">
      {(provided) => (
        <section
          className="column"
          ref={provided.innerRef}
          {...provided.droppableProps}
        >
          <h3>Done</h3>

          {doneTasks.map((task, index) =>
            renderTask(task, index)
          )}

          {provided.placeholder}
        </section>
      )}
    </Droppable>
  </div>
        </DragDropContext>
        
      </main>
    </div>
  );
}

export default App;