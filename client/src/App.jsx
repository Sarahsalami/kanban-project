import { useEffect, useState } from "react";
import axios from "axios";
import socket from "./socket";
import "./App.css";
import {
  DragDropContext,
  Droppable,
  Draggable,
} from "@hello-pangea/dnd";
function App() {
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState("");
  const [activities, setActivities] = useState([]);
  const boardId = "6a7ede6f2cd428df16d0e9dd";

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
  {
    ...newTask,
    boardId,
  },
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
        `http://localhost:5000/api/tasks?boardId=${boardId}`,
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
}, [boardId]);

useEffect(() => {
  const handleTaskCreated = (task) => {
    setTasks((currentTasks) => {
      const alreadyExists = currentTasks.some(
        (currentTask) => currentTask._id === task._id
      );

      if (alreadyExists) {
        return currentTasks;
      }

      return [task, ...currentTasks];
    });
  };

  const handleTaskUpdated = (updatedTask) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task._id === updatedTask._id
          ? updatedTask
          : task
      )
    );
  };

  const handleTaskDeleted = (taskId) => {
    setTasks((currentTasks) =>
      currentTasks.filter((task) => task._id !== taskId)
    );
  };
const handleActivityCreated = (activity) => {
  setActivities((currentActivities) => {
    const alreadyExists = currentActivities.some(
      (currentActivity) => currentActivity._id === activity._id
    );

    if (alreadyExists) {
      return currentActivities;
    }

    return [activity, ...currentActivities];
  });
};
  
  socket.on("taskCreated", handleTaskCreated);
  socket.on("taskUpdated", handleTaskUpdated);
  socket.on("taskDeleted", handleTaskDeleted);
  socket.on("activityCreated", handleActivityCreated);

  return () => {
    socket.off("taskCreated", handleTaskCreated);
    socket.off("taskUpdated", handleTaskUpdated);
    socket.off("taskDeleted", handleTaskDeleted);
    socket.off("activityCreated", handleActivityCreated);
  };
}, []);

useEffect(() => {
  fetchActivities();
}, [boardId]); 

useEffect(() => {
  socket.emit("joinBoard", boardId);

  console.log("Joined Socket.IO board:", boardId);

  return () => {
    socket.emit("leaveBoard", boardId);
  };
}, [boardId]);
  
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

  const task = tasks.find(
    (task) => task._id === draggableId
  );

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
        version: task.version,
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

    if (err.response?.status === 409) {
      const latestTask = err.response.data.currentTask;

      setTasks((currentTasks) =>
        currentTasks.map((currentTask) =>
          currentTask._id === latestTask._id
            ? latestTask
            : currentTask
        )
      );

      setError(
        "This task was changed by another user. The latest version has been loaded."
      );

      return;
    }

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
        version: editingTask.version,
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

    if (err.response?.status === 409) {
      const latestTask = err.response.data.currentTask;

      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task._id === latestTask._id
            ? latestTask
            : task
        )
      );

      setEditingTask(null);

      setError(
        "This task was changed by another user. The latest version has been loaded."
      );

      return;
    }

    setError("Unable to update task");
  }
};
    const fetchActivities = async () => {
  try {
    const token = localStorage.getItem("token");

    const response = await axios.get(
      `http://localhost:5000/api/activity?boardId=${boardId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setActivities(response.data.activities);
  } catch (err) {
    console.error("Unable to load activity:", err);
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
     <section className="activity-panel">
  <h3>Recent Activity</h3>

  {activities.length === 0 ? (
    <p>No activity yet.</p>
  ) : (
    activities.map((activity) => (
      <div className="activity-item" key={activity._id}>
        <strong>{activity.user?.name || "Unknown user"}</strong>

        {activity.action === "TASK_CREATED" && (
          <span> created "{activity.metadata?.title}"</span>
        )}

        {activity.action === "TASK_UPDATED" && (
          <span> updated "{activity.metadata?.title}"</span>
        )}

        {activity.action === "TASK_MOVED" && (
          <span>
            {" "}moved "{activity.metadata?.title}" from{" "}
            {activity.metadata?.previousStatus} to{" "}
            {activity.metadata?.newStatus}
          </span>
        )}

        {activity.action === "TASK_DELETED" && (
          <span> deleted "{activity.metadata?.title}"</span>
        )}
      </div>
    ))
  )}
</section>   
      </main>
    </div>
  );
}

export default App;