import { NextResponse } from 'next/server';

const RANSOMLOOK_API = 'https://www.ransomlook.io/api';
const RANSOMWARE_LIVE_API = 'https://api.ransomware.live/v2';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (!type) {
      return NextResponse.json(
        { success: false, error: 'Type parameter is required' },
        { status: 400 }
      );
    }

    // ─── Dashboard: parallel fetch recent victims, hot groups, stats ───
    if (type === 'dashboard') {
      const [recentResult, hotResult, statsResult] = await Promise.allSettled([
        // Recent 50 victim posts from RansomLook
        (async () => {
          const res = await fetch(`${RANSOMLOOK_API}/recent/50`, {
            next: { revalidate: 600 }
          });
          if (!res.ok) throw new Error(`RansomLook /recent responded ${res.status}`);
          return res.json();
        })(),

        // Trending groups (last 7 days) from RansomLook
        (async () => {
          const res = await fetch(`${RANSOMLOOK_API}/hot/7`, {
            next: { revalidate: 600 }
          });
          if (!res.ok) throw new Error(`RansomLook /hot responded ${res.status}`);
          return res.json();
        })(),

        // Platform stats from RansomLook
        (async () => {
          const res = await fetch(`${RANSOMLOOK_API}/stats`, {
            next: { revalidate: 600 }
          });
          if (!res.ok) throw new Error(`RansomLook /stats responded ${res.status}`);
          return res.json();
        })(),
      ]);

      const recent = recentResult.status === 'fulfilled' ? recentResult.value : [];
      const hot = hotResult.status === 'fulfilled' ? hotResult.value : { rows: [], total_posts: 0, days: 7 };
      const stats = statsResult.status === 'fulfilled' ? statsResult.value : null;

      // Format recent victims for the frontend
      const formattedRecent = (Array.isArray(recent) ? recent : []).map((post: any) => ({
        title: post.post_title || 'Unknown',
        group: post.group_name || 'Unknown',
        discovered: post.discovered || null,
        description: post.description || '',
        website: post.website || null,
      }));

      return NextResponse.json({
        success: true,
        recent: formattedRecent,
        hot: {
          days: hot.days || 7,
          total_posts: hot.total_posts || 0,
          from_date: hot.from_date || null,
          rows: (hot.rows || []).map((r: any) => ({
            group: r.group,
            count: r.count,
            last_post: r.last_post || null,
          })),
        },
        stats: stats ? {
          groups: stats.groups || 0,
          groups_online: stats.groups_online || 0,
          posts_total: stats.posts_total || 0,
          posts_24h: stats.posts_24h || 0,
          posts_month: stats.posts_month || 0,
          posts_month_label: stats.posts_month_label || '',
          posts_90d: stats.posts_90d || 0,
          posts_year: stats.posts_year || 0,
          year: stats.year || new Date().getFullYear(),
          markets: stats.markets || 0,
          parsers: stats.parsers || 0,
        } : null,
      });
    }

    // ─── Groups list from Ransomware.live v2 ───
    if (type === 'groups') {
      const res = await fetch(`${RANSOMWARE_LIVE_API}/groups`, {
        next: { revalidate: 1800 }
      });

      if (!res.ok) {
        return NextResponse.json({
          success: false,
          error: `Ransomware.live responded with status: ${res.status}`
        });
      }

      const data = await res.json();

      // data is typically an array of group objects
      const groups = (Array.isArray(data) ? data : []).map((g: any) => ({
        name: g.name || g.group_name || 'Unknown',
        description: g.description || '',
        url: g.url || null,
        locations: g.locations || [],
        profile: g.profile || [],
      }));

      return NextResponse.json({ success: true, groups });
    }

    // ─── Group detail from RansomLook ───
    if (type === 'group-detail') {
      const name = searchParams.get('name');
      if (!name) {
        return NextResponse.json(
          { success: false, error: 'Group name parameter is required' },
          { status: 400 }
        );
      }

      const res = await fetch(`${RANSOMLOOK_API}/group/${encodeURIComponent(name)}`, {
        next: { revalidate: 600 }
      });

      if (!res.ok) {
        return NextResponse.json({
          success: false,
          error: `RansomLook responded with status: ${res.status}`
        });
      }

      const data = await res.json();

      // RansomLook returns [group_object, posts_object]
      const groupInfo = Array.isArray(data) && data.length > 0 ? data[0] : data;
      const groupPosts = Array.isArray(data) && data.length > 1 ? data[1] : {};

      // Extract locations with availability status
      const locations = (groupInfo?.locations || []).map((loc: any) => ({
        slug: loc.slug || loc.fqdn || '',
        title: loc.title || '',
        available: loc.available || false,
        updated: loc.updated || null,
        type: loc.type || 'unknown',
      }));

      // Extract posts
      const posts = Object.values(groupPosts || {}).map((post: any) => ({
        title: post.post_title || 'Unknown',
        discovered: post.discovered || null,
        description: post.description || '',
        website: post.website || null,
      }));

      return NextResponse.json({
        success: true,
        group: {
          name: groupInfo?.name || name,
          locations,
          meta: {
            captcha: groupInfo?.captcha || false,
            parser: groupInfo?.parser || false,
            javascript_render: groupInfo?.javascript_render || false,
            raas: groupInfo?.raas || false,
          },
        },
        posts: posts.slice(0, 20), // Return up to 20 most recent posts
      });
    }

    // ─── Search across victims and groups ───
    if (type === 'search') {
      const q = searchParams.get('q');
      if (!q || q.length < 2) {
        return NextResponse.json(
          { success: false, error: 'Search query must be at least 2 characters' },
          { status: 400 }
        );
      }

      const res = await fetch(`${RANSOMLOOK_API}/search?q=${encodeURIComponent(q)}`, {
        next: { revalidate: 300 }
      });

      if (!res.ok) {
        return NextResponse.json({
          success: false,
          error: `Search service responded with status: ${res.status}`
        });
      }

      const data = await res.json();

      return NextResponse.json({
        success: true,
        results: {
          groups: data.groups || [],
          posts: (data.posts || []).map((p: any) => ({
            title: p.post_title || 'Unknown',
            group: p.group_name || 'Unknown',
            discovered: p.discovered || null,
            website: p.website || null,
          })),
          leaks: data.leaks || [],
          notes: data.notes || [],
        },
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid type. Use "dashboard", "groups", "group-detail", or "search"' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Ransomware API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
