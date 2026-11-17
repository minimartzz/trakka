import { getCallerProfileRow } from "@/utils/fetchServerUser";
import { db } from "@/utils/db";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  image: string | null;
  href: string;
}

const LIMIT = 20;

export async function GET(request: Request) {
  const viewer = await getCallerProfileRow();
  if (!viewer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const raw = (searchParams.get("term") ?? "").trim();

  // Prevent DoS via excessively large search strings
  if (raw.length > 50) {
    return NextResponse.json({ error: "Search term too long" }, { status: 400 });
  }

  // A leading "@" narrows user search to usernames
  const usernameOnly = raw.startsWith("@");
  const term = usernameOnly ? raw.slice(1) : raw;
  if (term.length < 2) {
    return NextResponse.json({ error: "Search term too short" }, { status: 400 });
  }
  const contains = `%${term}%`;

  try {
    let results: SearchResult[];

    if (type === "users") {
      const fullName = sql`(first_name || ' ' || last_name)`;
      const rows = await db.execute<{
        id: number;
        first_name: string;
        last_name: string;
        username: string;
        image: string;
      }>(
        usernameOnly
          ? sql`
            select id, first_name, last_name, username, image
              from profile
             where not is_anonymous
               and (username % ${term} or username ilike ${contains})
             order by similarity(username, ${term}) desc
             limit ${LIMIT}`
          : sql`
            select id, first_name, last_name, username, image
              from profile
             where not is_anonymous
               and (first_name % ${term} or last_name % ${term}
                    or ${fullName} % ${term} or username % ${term}
                    or ${fullName} ilike ${contains} or username ilike ${contains})
             order by greatest(similarity(first_name, ${term}),
                               similarity(last_name, ${term}),
                               similarity(${fullName}, ${term}),
                               similarity(username, ${term})) desc
             limit ${LIMIT}`,
      );
      results = rows.map((r) => ({
        id: String(r.id),
        title: `${r.first_name} ${r.last_name}`,
        subtitle: `@${r.username}`,
        image: r.image || null,
        href: `/player/${r.username}`,
      }));
    } else if (type === "tribes") {
      const rows = await db.execute<{
        id: string;
        name: string;
        image: string;
        member_count: number;
        is_member: boolean;
      }>(sql`
        select g.id, g.name, g.image,
               count(pg.profile_id)::int as member_count,
               coalesce(bool_or(pg.profile_id = ${viewer.id}), false) as is_member
          from "group" g
          left join profile_group pg on pg.group_id = g.id
         where g.name % ${term} or g.name ilike ${contains}
         group by g.id
         order by similarity(g.name, ${term}) desc, count(pg.profile_id) desc
         limit ${LIMIT}`);
      results = rows.map((r) => ({
        id: r.id,
        title: r.name,
        subtitle: `${r.member_count} member${r.member_count === 1 ? "" : "s"}`,
        image: r.image || null,
        // Public tribe pages don't exist yet, so only members get the real page
        href: r.is_member ? `/tribe/${r.id}` : "/coming-soon",
      }));
    } else if (type === "games") {
      const rows = await db.execute<{
        id: number;
        name: string;
        thumbnail: string | null;
        year_published: number;
      }>(sql`
        select id, name, thumbnail, year_published
          from game
         where name % ${term} or name ilike ${contains}
         order by similarity(name, ${term}) desc, rating desc
         limit ${LIMIT}`);
      results = rows.map((r) => ({
        id: String(r.id),
        title: r.name,
        subtitle: String(r.year_published),
        image: r.thumbnail,
        href: "/coming-soon",
      }));
    } else {
      return NextResponse.json({ error: "Unknown search type" }, { status: 400 });
    }

    return NextResponse.json(results, {
      headers: { "Cache-Control": "private, max-age=30" },
    });
  } catch (err) {
    console.error("Error running global search: ", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
