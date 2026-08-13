import { useState } from "react";
import { getUserInitials } from "../../utils/userUtils.js";

function UserAvatar({ user, size = "medium", className = "", decorative = false }) {
  const [failedUrl, setFailedUrl] = useState(null);
  const imageUrl = user.profileImageUrl && failedUrl !== user.profileImageUrl ? user.profileImageUrl : null;
  const label = `Profile photo for ${user.name}`;
  return <span className={`user-avatar user-avatar--${size} ${className}`.trim()} aria-label={decorative ? undefined : label} aria-hidden={decorative || undefined}>
    {imageUrl ? <img src={imageUrl} alt={decorative ? "" : label} onError={() => setFailedUrl(imageUrl)} /> : <span aria-hidden="true">{getUserInitials(user.name)}</span>}
  </span>;
}
export default UserAvatar;
