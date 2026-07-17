import { useAuthStore } from "../store";

export default function Profile() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="page">
      <h1>Mi Perfil</h1>
      <div className="profile-info">
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>Nombre:</strong> {user?.display_name}</p>
        <p><strong>Rol:</strong> {user?.role}</p>
      </div>
    </div>
  );
}
