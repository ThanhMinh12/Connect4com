import { useAuth } from '../../contexts/AuthContext';

function ProfilePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ padding: '2rem' }}>
        <p>Loading user info...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>👤 Profile</h1>
      {user ? (
        <div>
          <p><strong>Username:</strong> {user.username}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Elo:</strong> {user.elo}</p>
        </div>
      ) : (
        <p>Please log in to view your profile.</p>
      )}
    </div>
  );
}

export default ProfilePage;