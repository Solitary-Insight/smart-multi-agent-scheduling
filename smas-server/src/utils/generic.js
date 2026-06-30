function capitalizeFirst(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}


function getDBDateTime() {
  return new Date()
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");
}


 function formatTimeAgo(dateString) {
  if (!dateString) return "";

  const now = new Date();
  const past = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  // If the date is in the future or invalid
  if (diffInSeconds < 0) return "just now";

  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'min', seconds: 60 },
    { label: 'sec', seconds: 1 }
  ];

  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count !== 1 ? 's' : ''} ago`;
    }
  }

  return "just now";
}

module.exports = { capitalizeFirst , getDBDateTime,formatTimeAgo}