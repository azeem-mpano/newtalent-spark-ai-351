import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.103.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { job_id, shortlist_count, job_details, applications } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const prompt = `You are an expert AI recruiter for the Umurava AI Hackathon Talent Screening System. Analyze each candidate using the structured Talent Profile Schema and return detailed results.

Job: ${job_details.title} at ${job_details.company}
Description: ${job_details.description}
Required Skills: ${job_details.skills_required.join(", ")}
Requirements: ${job_details.requirements.join("; ")}

Candidates:
${applications.map((a: any, i: number) => {
  const p = a.profile || {};
  const skills = Array.isArray(p.skills) ? p.skills.map((s: any) => typeof s === "string" ? s : `${s.name} (${s.level}, ${s.yearsOfExperience}y)`).join(", ") : "N/A";
  const languages = Array.isArray(p.languages) ? p.languages.map((l: any) => `${l.name} (${l.proficiency})`).join(", ") : "N/A";
  const experience = Array.isArray(p.experience) ? p.experience.map((e: any) => `${e.role} at ${e.company} (${e.startDate}–${e.isCurrent ? "Present" : e.endDate}): ${e.description || ""} [${(e.technologies || []).join(", ")}]`).join("\n    ") : "N/A";
  const education = Array.isArray(p.education) ? p.education.map((e: any) => `${e.degree} in ${e.fieldOfStudy} at ${e.institution} (${e.startYear}–${e.endYear})`).join("; ") : "N/A";
  const certifications = Array.isArray(p.certifications) ? p.certifications.map((c: any) => `${c.name} by ${c.issuer}`).join("; ") : "None";
  const projects = Array.isArray(p.projects) ? p.projects.map((pr: any) => `${pr.name}: ${pr.description} [${(pr.technologies || []).join(", ")}] (${pr.role})`).join("\n    ") : "None";
  const availability = p.availability ? `${p.availability.status} - ${p.availability.type}` : "N/A";

  return `
Candidate ${i + 1} (ID: ${a.id}):
  Name: ${p.first_name || ""} ${p.last_name || p.full_name || "Unknown"}
  Headline: ${p.headline || "N/A"}
  Location: ${p.location || "N/A"}
  Skills: ${skills}
  Languages: ${languages}
  Experience (${p.experience_years ?? "N/A"} years total):
    ${experience}
  Education: ${education}
  Certifications: ${certifications}
  Projects:
    ${projects}
  Availability: ${availability}
  Cover Letter: ${a.cover_letter || "None"}
  LinkedIn: ${a.linkedin_url || "None"}
  GitHub: ${a.github_url || "None"}
  Portfolio: ${a.portfolio_url || "None"}`;
}).join("\n")}

Score each candidate 0-100 based on:
1. Skill match (name, level, years) vs job requirements
2. Relevant work experience and achievements
3. Education and certifications relevance
4. Project portfolio quality and relevance
5. Profile completeness and professionalism

Select the top ${shortlist_count} candidates.

IMPORTANT: For the analysis field, use this EXACT format:
Strengths: [bullet points]
Weaknesses: [bullet points]
Challenges: [bullet points]
Why Selected: [reason]`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are an expert AI recruiter for the Umurava Hackathon Talent Screening System. Return valid JSON only. Evaluate candidates using the full structured talent profile (skills with levels, work experience, education, projects, certifications). Provide detailed analysis with Strengths, Weaknesses, Challenges, and Why Selected sections." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "submit_screening_results",
            description: "Submit candidate screening scores and analysis",
            parameters: {
              type: "object",
              properties: {
                results: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      score: { type: "number" },
                      analysis: { type: "string", description: "Structured analysis with: Strengths, Weaknesses, Challenges, Why Selected" },
                      shortlisted: { type: "boolean" },
                    },
                    required: ["id", "score", "analysis", "shortlisted"],
                  },
                },
              },
              required: ["results"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "submit_screening_results" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) return new Response(JSON.stringify({ error: "Rate limited, try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiResponse.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted. Add funds in Settings." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No AI response");

    const { results } = JSON.parse(toolCall.function.arguments);

    for (const r of results) {
      await supabase.from("applications").update({
        ai_score: r.score,
        ai_analysis: r.analysis,
        is_shortlisted: r.shortlisted,
        status: r.shortlisted ? "shortlisted" : "reviewed",
      }).eq("id", r.id);
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Screening error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
