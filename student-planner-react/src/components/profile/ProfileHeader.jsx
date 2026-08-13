import UserAvatar from "./UserAvatar.jsx";

function ProfileHeader({ user, onEdit }) {
  return <section className="profile-header" aria-label="Student profile">
    <button className="profile-header__avatar" type="button" onClick={onEdit} aria-label="Edit profile photo"><UserAvatar user={user} size="header" decorative /></button>
    <div className="profile-header__identity"><strong>{user.name}</strong><a href={`mailto:${user.email}`}>{user.email}</a><span>Student account</span></div>
    <button className="profile-header__edit" type="button" onClick={onEdit}>✎ <span>Edit Profile</span></button>
  </section>;
}
export default ProfileHeader;
