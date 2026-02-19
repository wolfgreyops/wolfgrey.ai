import { getQueue, getQueueStats } from '@/lib/content-queue';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  let stats = { pending: 0, posted: 0, failed: 0, nextScheduled: null as string | null };
  let queue: Awaited<ReturnType<typeof getQueue>> = [];
  let error = '';

  try {
    stats = await getQueueStats();
    queue = await getQueue();
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load queue';
  }

  const pendingPosts = queue
    .filter((p) => p.status === 'pending')
    .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime());

  const recentPosts = queue
    .filter((p) => p.status === 'posted')
    .sort((a, b) => new Date(b.postedAt || 0).getTime() - new Date(a.postedAt || 0).getTime())
    .slice(0, 5);

  return (
    <div>
      <h1 style={{ marginBottom: '0.5rem' }}>X Autoposter</h1>
      <p style={{ color: '#888', marginBottom: '2rem' }}>wolfgrey.ai content engine</p>

      {error && (
        <div style={{
          background: '#331111',
          border: '1px solid #ff4444',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '2rem'
        }}>
          {error}
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <StatCard label="Pending" value={stats.pending} color="#00e5cc" />
        <StatCard label="Posted" value={stats.posted} color="#22c55e" />
        <StatCard label="Failed" value={stats.failed} color="#ef4444" />
      </div>

      {stats.nextScheduled && (
        <p style={{ color: '#888', marginBottom: '2rem' }}>
          Next post: {new Date(stats.nextScheduled).toLocaleString()}
        </p>
      )}

      <h2 style={{ marginBottom: '1rem' }}>Upcoming Posts</h2>
      {pendingPosts.length === 0 ? (
        <p style={{ color: '#666' }}>No posts in queue. Generate content to get started.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {pendingPosts.slice(0, 7).map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {recentPosts.length > 0 && (
        <>
          <h2 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Recently Posted</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {recentPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </>
      )}

      <div style={{ marginTop: '3rem', padding: '1rem', background: '#111', borderRadius: '8px' }}>
        <h3 style={{ marginBottom: '0.5rem' }}>API Endpoints</h3>
        <code style={{ display: 'block', color: '#888', fontSize: '0.85rem' }}>
          POST /api/generate - Generate week of content<br />
          GET /api/post - Post next tweet (cron)<br />
          GET /api/queue - View queue stats
        </code>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{
      background: '#111',
      padding: '1.5rem',
      borderRadius: '8px',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '2rem', fontWeight: 'bold', color }}>{value}</div>
      <div style={{ color: '#888', fontSize: '0.9rem' }}>{label}</div>
    </div>
  );
}

function PostCard({ post }: { post: Awaited<ReturnType<typeof getQueue>>[0] }) {
  const content = Array.isArray(post.content) ? post.content[0] : post.content;
  const isThread = post.type === 'thread';

  return (
    <div style={{
      background: '#111',
      padding: '1rem',
      borderRadius: '8px',
      borderLeft: `3px solid ${post.status === 'posted' ? '#22c55e' : post.status === 'failed' ? '#ef4444' : '#00e5cc'}`
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <span style={{
          background: '#222',
          padding: '0.25rem 0.5rem',
          borderRadius: '4px',
          fontSize: '0.75rem'
        }}>
          {post.theme} {isThread && '(thread)'}
        </span>
        <span style={{ color: '#666', fontSize: '0.8rem' }}>
          {new Date(post.scheduledFor).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          })}
        </span>
      </div>
      <p style={{ margin: 0, color: '#ccc', fontSize: '0.9rem' }}>
        {content.slice(0, 150)}{content.length > 150 ? '...' : ''}
      </p>
      {post.tweetId && (
        <a
          href={`https://twitter.com/i/web/status/${post.tweetId}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#00e5cc', fontSize: '0.8rem', marginTop: '0.5rem', display: 'inline-block' }}
        >
          View on X →
        </a>
      )}
    </div>
  );
}
