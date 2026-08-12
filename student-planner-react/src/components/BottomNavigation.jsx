const navigationItems = [
  { label: "Dashboard", icon: "⌂", href: "#dashboard" },
  { label: "Calendar", icon: "□", href: "#calendar" },
  { label: "Tasks", icon: "✓", href: "#tasks" },
  { label: "Events", icon: "◇", href: "#events" },
];

function NavigationLink({ item }) {
  return (
    <a href={item.href}>
      <span aria-hidden="true">{item.icon}</span>
      {item.label}
    </a>
  );
}

function BottomNavigation() {
  return (
    <nav className="bottom-navigation" aria-label="Mobile navigation">
      {navigationItems.slice(0, 2).map((item) => (
        <NavigationLink item={item} key={item.label} />
      ))}
      <a className="floating-add" href="#task-text" aria-label="Go to the new task form">+</a>
      {navigationItems.slice(2).map((item) => (
        <NavigationLink item={item} key={item.label} />
      ))}
    </nav>
  );
}

export default BottomNavigation;
