// Deterministic color from username
const AVATAR_GRADIENTS = [
  ["#667eea", "#764ba2"],
  ["#f093fb", "#f5576c"],
  ["#4facfe", "#00f2fe"],
  ["#43e97b", "#38f9d7"],
  ["#fa709a", "#fee140"],
  ["#30cfd0", "#330867"],
  ["#a8edea", "#fed6e3"],
  ["#ff9a9e", "#fecfef"],
  ["#ffecd2", "#fcb69f"],
  ["#84fab0", "#8fd3f4"],
  ["#c471f5", "#fa71cd"],
  ["#48c6ef", "#6f86d6"],
];

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getAvatarGradient(username = "?") {
  const [from, to] = AVATAR_GRADIENTS[hashString(username) % AVATAR_GRADIENTS.length];
  return `linear-gradient(135deg, ${from} 0%, ${to} 100%)`;
}

export function getInitials(username = "?") {
  const parts = username.trim().split(/[\s_-]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function Avatar({ username, size = 36 }) {
  return (
    <div
      className="avatar"
      style={{
        width: size,
        height: size,
        background: getAvatarGradient(username),
        fontSize: size * 0.4,
      }}
      title={username}
    >
      {getInitials(username)}
    </div>
  );
}
