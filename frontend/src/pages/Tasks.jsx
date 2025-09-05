import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import { AiOutlineCheck, AiOutlineClose } from "react-icons/ai";

export default function Tasks() {
  const { api, logout, user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [form, setForm] = useState({ title: "", description: "" });
  const [modalLoading, setModalLoading] = useState(false);
  const [taskLoadingIds, setTaskLoadingIds] = useState([]); // array of loading task IDs
  const navigate = useNavigate();

  const fetchTasks = async () => {
    setLoadingTasks(true);
    try {
      const res = await api.get("/user/tasks");
      setTasks(res.data.tasks);
    } catch (err) {
      alert(err.response?.data?.message || "Error fetching tasks");
    } finally {
      setLoadingTasks(false);
    }
  };

  const openModal = (task = null) => {
    setEditingTask(task);
    setForm(task ? { title: task.title, description: task.description } : { title: "", description: "" });
    setModalOpen(true);
  };

  const closeModal = () => {
    setEditingTask(null);
    setForm({ title: "", description: "" });
    setModalOpen(false);
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setModalLoading(true);
  try {
    if (editingTask) {
      const res = await api.put(`/user/update-task/${editingTask._id}`, form);
      setTasks((prev) =>
        prev.map((t) =>
          t._id === editingTask._id ? { ...t, ...form } : t
        )
      );
    } else {
      const res = await api.post("/user/add-task", form);
      setTasks((prev) => [...prev, res.data.task]);
    }
    closeModal();
  } catch (err) {
    alert(err.response?.data?.message || "Error");
  } finally {
    setModalLoading(false);
  }
};


  const setTaskLoading = (id, value) => {
    setTaskLoadingIds((prev) =>
      value ? [...prev, id] : prev.filter((tid) => tid !== id)
    );
  };

  const deleteTask = async (id) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    setTaskLoading(id, true);
    try {
      await api.delete(`/user/delete-task/${id}`);
      await fetchTasks();
    } catch (err) {
      alert(err.response?.data?.message || "Error deleting task");
    } finally {
      setTaskLoading(id, false);
    }
  };

  const toggleComplete = async (id, task) => {
    setTaskLoading(id, true);
    try {
      await api.put(`/user/update-task/${id}`, { ...task, completed: !task.completed });
      await fetchTasks();
    } catch (err) {
      alert(err.response?.data?.message || "Error updating task");
    } finally {
      setTaskLoading(id, false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Welcome, {user?.userName || "Back"}</h1>
        <div className="flex space-x-3 mt-3 sm:mt-0">
          <button
            onClick={() => openModal()}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow-md transition transform hover:scale-105 cursor-pointer"
          >
            Add Task
          </button>
          <button
            onClick={() => {
              logout();
              navigate("/signin");
            }}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow-md transition transform hover:scale-105 cursor-pointer"
          >
            Logout
          </button>
        </div>
      </div>

      {loadingTasks ? (
        <div className="flex justify-center items-center mt-20 text-gray-600">
          <svg className="animate-spin h-8 w-8 mr-2 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          <span>Loading Tasks...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {tasks.map((t) => {
            const isLoading = taskLoadingIds.includes(t._id);
            return (
              <div
                key={t._id}
                className={`p-5 rounded-2xl shadow-lg bg-white flex flex-col justify-between transition transform hover:scale-105 ${
                  t.completed ? "opacity-60 line-through" : ""
                }`}
              >
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">{t.title}</h2>
                  <p className="text-gray-600 mt-2">{t.description}</p>
                </div>
                <div className="flex justify-between items-center mt-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => toggleComplete(t._id, t)}
                      disabled={isLoading}
                      className="p-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition transform hover:scale-110 cursor-pointer"
                      title={t.completed ? "Undo Complete" : "Mark Complete"}
                    >
                      {isLoading ? (
                        <svg className="animate-spin h-4 w-4 mx-auto text-white" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                        </svg>
                      ) : (
                        <AiOutlineCheck />
                      )}
                    </button>
                    <button
                      onClick={() => openModal(t)}
                      disabled={isLoading}
                      className="p-2 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-white transition transform hover:scale-110 cursor-pointer"
                      title="Edit Task"
                    >
                      <FiEdit />
                    </button>
                    <button
                      onClick={() => deleteTask(t._id)}
                      disabled={isLoading}
                      className="p-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition transform hover:scale-110 cursor-pointer"
                      title="Delete Task"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                  <span className="text-sm text-gray-500">{new Date(t.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex justify-center items-center bg-black/40 backdrop-blur-sm">
          <div className="relative bg-white/90 backdrop-blur-md rounded-2xl p-6 w-11/12 sm:w-96 shadow-xl border border-gray-200">
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 transition cursor-pointer"
            >
              <AiOutlineClose size={22} />
            </button>
            <h2 className="text-2xl font-bold mb-5 text-indigo-700 text-center">
              {editingTask ? "Edit Task" : "Add Task"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm placeholder-gray-400"
                required
              />
              <textarea
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm placeholder-gray-400"
                required
              />
              <button
                type="submit"
                disabled={modalLoading}
                className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-semibold shadow-md transition cursor-pointer ${
                  modalLoading ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                {modalLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span>{editingTask ? "Updating..." : "Adding..."}</span>
                  </div>
                ) : editingTask ? (
                  "Update Task"
                ) : (
                  "Add Task"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
