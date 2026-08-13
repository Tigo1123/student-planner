import UserAvatar from "./UserAvatar.jsx";

function ProfileHeader({ user, onEdit }) {
  return <section className="profile-header" aria-label="Student profile">
    <button className="profile-header__avatar" type="button" onClick={onEdit} aria-label="Edit profile photo"><UserAvatar user={user} size="header" decorative /></button>
    <div className="profile-header__identity"><h2>{user.name}</h2><a href={`mailto:${user.email}`}>{user.email}</a><button className="profile-header__edit" type="button" onClick={onEdit}>✎ <span>Edit Profile</span></button></div>
  </section>;
}
export default ProfileHeader;
