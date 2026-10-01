// SwachhScore engine. The ONLY place a user's score changes. Frontend can never set a score.
// ENHANCE: move POINTS/TITLES to a DB collection so admins can tune them without a deploy.
const { User, ScoreEvent, Notification } = require('../models');

const TITLES = [
  { min: 0, title: 'Clean Starter' }, { min: 100, title: 'Waste Warrior' }, { min: 250, title: 'Green Guardian' },
  { min: 500, title: 'Clean Guardian' }, { min: 750, title: 'Swachh Champion' }, { min: 1000, title: 'Swachh Legend' },
];
const POINTS = { pickupCitizen: 20, pickupCollector: 30, reportVerified: 15, awarenessRead: 2, ratingBonus: 5 };

function titleFor(score) {
  let cur = TITLES[0], next = null;
  for (let i = 0; i < TITLES.length; i++) if (score >= TITLES[i].min) { cur = TITLES[i]; next = TITLES[i + 1] || null; }
  return { title: cur.title, min: cur.min, next: next && { title: next.title, min: next.min }, };
}

// refKey makes awards idempotent (same pickup can't be rewarded twice).
async function award({ userId, points, reason, kind, refKey, topic, notify = true }) {
  if (refKey && await ScoreEvent.exists({ refKey })) return null;
  const u = await User.findById(userId);
  if (!u) return null;
  const newScore = Math.max(0, (u.swachhScore || 0) + points); // score never below 0
  const delta = newScore - (u.swachhScore || 0);
  u.swachhScore = newScore; await u.save();
  const ev = await ScoreEvent.create({ user: userId, points: delta, reason, kind, refKey, topic });
  if (notify) {
    const penalty = points < 0;
    await Notification.create({
      user: userId, type: penalty ? 'penalty' : 'score', awarenessSlug: penalty ? (topic || 'segregation') : undefined,
      title: penalty ? 'A quick reminder' : `+${delta} SwachhScore`,
      message: penalty ? `Your SwachhScore changed by ${delta} after a verified review. ${reason}` : reason,
    });
  }
  return ev;
}
module.exports = { TITLES, POINTS, titleFor, award };
