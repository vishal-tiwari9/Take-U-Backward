export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { linkedinUrl } = await req.json();

    if (!linkedinUrl) {
      return NextResponse.json({ error: "LinkedIn URL is required" }, { status: 400 });
    }

    // Validate it looks like a LinkedIn URL
    if (!linkedinUrl.includes("linkedin.com/in/")) {
      return NextResponse.json(
        { error: "Please enter a valid LinkedIn profile URL (linkedin.com/in/...)" },
        { status: 400 }
      );
    }

    if (!process.env.PROXYCURL_API_KEY) {
      return NextResponse.json(
        { error: "Proxycurl API key not configured." },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://nubela.co/proxycurl/api/v2/linkedin?url=${encodeURIComponent(linkedinUrl)}&skills=include&personal_email=exclude&personal_contact_number=exclude`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PROXYCURL_API_KEY}`,
        },
      }
    );

    if (response.status === 404) {
      return NextResponse.json(
        { error: "LinkedIn profile not found. Make sure the URL is correct and the profile is public." },
        { status: 404 }
      );
    }

    if (response.status === 402) {
      return NextResponse.json(
        { error: "Proxycurl credits exhausted. Please top up your account." },
        { status: 402 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch LinkedIn profile. Please fill in the fields manually." },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Extract username from URL for building LinkedIn edit links
    const usernameMatch = linkedinUrl.match(/linkedin\.com\/in\/([^/?]+)/);
    const username = usernameMatch?.[1] ?? "";

    // Map Proxycurl response to our form fields
    const profile = {
      username,
      headline: data.headline ?? "",
      about: data.summary ?? "",
      currentRole: data.experiences?.[0]?.title ?? "",
      company: data.experiences?.[0]?.company ?? "",
      industry: data.industry ?? "",
      skills: data.skills?.map((s: { name: string }) => s.name).join(", ") ?? "",
      education: data.education
        ?.map(
          (e: { school: string; field_of_study: string; degree_name: string }) =>
            `${e.degree_name ?? ""} ${e.field_of_study ?? ""} at ${e.school ?? ""}`.trim()
        )
        .join("; ") ?? "",
      achievements: data.accomplishment_projects
        ?.map((p: { title: string; description: string }) => `${p.title}: ${p.description ?? ""}`)
        .join("\n") ?? "",
      followerCount: data.follower_count ?? 0,
      connectionCount: data.connections ?? 0,
      profilePicture: data.profile_pic_url ?? "",
      fullName: `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim(),
      location: data.city ? `${data.city}, ${data.country_full_name ?? ""}` : "",
    };

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("LinkedIn fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile. Please fill in the fields manually." },
      { status: 500 }
    );
  }
}
