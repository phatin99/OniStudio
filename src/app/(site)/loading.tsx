// oni-client-navigation-performance-v1
// Instant skeleton within the site layout while server content streams.
export default function SiteRouteLoading() {
  return (
    <div className="container oni-route-loading-v1" role="status" aria-busy="true" aria-label="Loading Oni Studio content">
      <span className="oni-route-loading-brand-v1">ONI STUDIO</span>
      <div className="oni-route-loading-bar-v1" />
      <div className="oni-route-loading-grid-v1" aria-hidden="true">
        <div className="oni-route-loading-tile-v1" />
        <div className="oni-route-loading-tile-v1" />
        <div className="oni-route-loading-tile-v1" />
      </div>
    </div>
  );
}