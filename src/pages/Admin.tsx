import { useState, useEffect } from "react";
import { authFetch } from "../lib/api";
import { Users, Tag, BarChart3, Loader2 } from "lucide-react";

interface User {
  id: string;
  email: string;
  display_name: string;
  role: string;
  is_active: boolean;
}

interface Metrics {
  total_users: number;
  active_users: number;
  inactive_users: number;
  characters_this_week: number;
  spots_this_week: number;
}

interface UserLimits {
  user_id: string;
  user_email: string;
  user_name: string;
  week_start: string;
  characters_used: number;
  characters_limit: number;
  characters_remaining: number;
  spots_used: number;
  spots_limit: number;
  spots_remaining: number;
}

interface Category {
  id: string;
  name: string;
  assigned_character_id: string | null;
}

type Tab = "users" | "categories";

export default function Admin() {
  const [activeTab, setActiveTab] = useState<Tab>("users");
  const [users, setUsers] = useState<User[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserLimits | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newUser, setNewUser] = useState({ email: "", display_name: "", password: "" });
  const [newCategoryName, setNewCategoryName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, metricsRes, categoriesRes] = await Promise.all([
        authFetch("/api/v1/users"),
        authFetch("/api/v1/admin/metrics"),
        fetch("/api/v1/categories"),
      ]);

      if (!usersRes.ok || !metricsRes.ok) throw new Error("Error al cargar datos");

      const usersData = await usersRes.json();
      const metricsData = await metricsRes.json();
      const categoriesData = categoriesRes.ok ? await categoriesRes.json() : [];

      setUsers(usersData);
      setMetrics(metricsData);
      setCategories(categoriesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const res = await authFetch("/api/v1/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newUser, role: "user" }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Error al crear usuario");
      }

      const created = await res.json();
      setUsers([...users, created]);
      setNewUser({ email: "", display_name: "", password: "" });
      setShowCreateModal(false);
      setSuccess(`Usuario ${created.email} creado exitosamente`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("¿Eliminar este usuario?")) return;
    try {
      const res = await authFetch(`/api/v1/users/${userId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");
      setUsers(users.filter((u) => u.id !== userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  };

  const handleViewLimits = async (userId: string) => {
    try {
      const res = await authFetch(`/api/v1/admin/users/${userId}/limits`);
      if (!res.ok) throw new Error("Error al cargar límites");
      const data = await res.json();
      setSelectedUser(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  };

  const handleUpdateLimits = async (field: "characters" | "spots", value: number) => {
    if (!selectedUser) return;
    try {
      const body = field === "characters"
        ? { characters_limit: value }
        : { spots_limit: value };

      const res = await authFetch(`/api/v1/admin/users/${selectedUser.user_id}/limits`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Error al actualizar límites");
      const data = await res.json();
      setSelectedUser(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const res = await authFetch("/api/v1/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Error al crear categoría");
      }

      const created = await res.json();
      setCategories([...categories, created]);
      setNewCategoryName("");
      setShowCategoryModal(false);
      setSuccess(`Categoría "${created.name}" creada exitosamente`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    setError("");
    setSuccess("");

    try {
      const res = await authFetch(`/api/v1/categories/${editingCategory.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Error al actualizar categoría");
      }

      const updated = await res.json();
      setCategories(categories.map((c) => (c.id === updated.id ? updated : c)));
      setNewCategoryName("");
      setEditingCategory(null);
      setShowCategoryModal(false);
      setSuccess(`Categoría actualizada exitosamente`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm("¿Eliminar esta categoría?")) return;
    try {
      const res = await authFetch(`/api/v1/categories/${categoryId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");
      setCategories(categories.filter((c) => c.id !== categoryId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  };

  if (loading) {
    return (
      <div className="inline-loading">
        <Loader2 size={20} className="spin" /> Cargando panel de administración...
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Panel de Administración</h1>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}

      {/* Métricas */}
      {metrics && (
        <div className="dashboard-cards">
          <div className="card">
            <h3><Users size={16} /> Usuarios Totales</h3>
            <p className="card-value">{metrics.total_users}</p>
            <p className="card-label">{metrics.active_users} activos / {metrics.inactive_users} inactivos</p>
          </div>
          <div className="card">
            <h3><BarChart3 size={16} /> Personajes esta semana</h3>
            <p className="card-value">{metrics.characters_this_week}</p>
          </div>
          <div className="card">
            <h3><BarChart3 size={16} /> Spots esta semana</h3>
            <p className="card-value">{metrics.spots_this_week}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="admin-tabs">
        <button
          className={`tab-btn ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          <Users size={16} /> Usuarios
        </button>
        <button
          className={`tab-btn ${activeTab === "categories" ? "active" : ""}`}
          onClick={() => setActiveTab("categories")}
        >
          <Tag size={16} /> Categorías
        </button>
      </div>

      {/* Tab Usuarios */}
      {activeTab === "users" && (
        <>
          <div className="section-header">
            <h2>Usuarios</h2>
            <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
              Crear Usuario
            </button>
          </div>
          <table className="users-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Nombre</th>
                <th>Rol</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.email}</td>
                  <td>{user.display_name}</td>
                  <td>{user.role === "admin" ? "Admin" : "Usuario"}</td>
                  <td className="actions-cell">
                    {user.role !== "admin" && (
                      <>
                        <button
                          onClick={() => handleViewLimits(user.id)}
                          className="btn-secondary"
                        >
                          Límites
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="btn-danger"
                        >
                          Eliminar
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Tab Categorías */}
      {activeTab === "categories" && (
        <>
          <div className="section-header">
            <h2>Categorías de Spots</h2>
            <button className="btn-primary" onClick={() => { setEditingCategory(null); setNewCategoryName(""); setShowCategoryModal(true); }}>
              Crear Categoría
            </button>
          </div>
          <table className="users-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id}>
                  <td>{cat.name}</td>
                  <td className="actions-cell">
                    <button
                      onClick={() => { setEditingCategory(cat); setNewCategoryName(cat.name); setShowCategoryModal(true); }}
                      className="btn-secondary"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="btn-danger"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr><td colSpan={2}>No hay categorías creadas</td></tr>
              )}
            </tbody>
          </table>
        </>
      )}

      {/* Modal de crear/editar usuario */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Crear Nuevo Usuario</h3>
            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label htmlFor="new-email">Email</label>
                <input
                  id="new-email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="new-name">Nombre</label>
                <input
                  id="new-name"
                  type="text"
                  value={newUser.display_name}
                  onChange={(e) => setNewUser({ ...newUser, display_name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="new-password">Contraseña</label>
                <input
                  id="new-password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn-primary">Crear</button>
                <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de crear/editar categoría */}
      {showCategoryModal && (
        <div className="modal-overlay" onClick={() => { setShowCategoryModal(false); setEditingCategory(null); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingCategory ? "Editar Categoría" : "Crear Categoría"}</h3>
            <form onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory}>
              <div className="form-group">
                <label htmlFor="cat-name">Nombre</label>
                <input
                  id="cat-name"
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  required
                  placeholder="Ej: Deportes, Noticias, Entretenimiento"
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn-primary">{editingCategory ? "Guardar" : "Crear"}</button>
                <button type="button" className="btn-secondary" onClick={() => { setShowCategoryModal(false); setEditingCategory(null); }}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de límites */}
      {selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Límites de {selectedUser.user_name}</h3>
            <p className="modal-subtitle">{selectedUser.user_email}</p>

            <div className="limits-grid">
              <div className="limit-item">
                <label>Personajes</label>
                <div className="limit-control">
                  <span>{selectedUser.characters_used} / {selectedUser.characters_limit}</span>
                  <span className="limit-remaining">({selectedUser.characters_remaining} restantes)</span>
                </div>
                <input
                  type="number"
                  min={selectedUser.characters_used}
                  max={10}
                  value={selectedUser.characters_limit}
                  onChange={(e) => handleUpdateLimits("characters", Number(e.target.value))}
                />
              </div>

              <div className="limit-item">
                <label>Spots</label>
                <div className="limit-control">
                  <span>{selectedUser.spots_used} / {selectedUser.spots_limit}</span>
                  <span className="limit-remaining">({selectedUser.spots_remaining} restantes)</span>
                </div>
                <input
                  type="number"
                  min={selectedUser.spots_used}
                  max={20}
                  value={selectedUser.spots_limit}
                  onChange={(e) => handleUpdateLimits("spots", Number(e.target.value))}
                />
              </div>
            </div>

            <button className="btn-secondary" onClick={() => setSelectedUser(null)}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}
