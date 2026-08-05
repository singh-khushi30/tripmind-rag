export function Footer() {
  return (
    <footer className="border-border border-t">
      <div className="text-muted-foreground mx-auto flex h-14 w-full max-w-6xl items-center px-4 text-sm sm:px-6">
        <p>&copy; {new Date().getFullYear()} TripMind</p>
      </div>
    </footer>
  );
}
