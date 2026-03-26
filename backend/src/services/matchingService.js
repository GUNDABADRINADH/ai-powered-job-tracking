const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { PromptTemplate } = require('@langchain/core/prompts');
const { StringOutputParser } = require('@langchain/core/output_parsers');
/**
 * matchingService.js
 * Unified matching logic with AI-powered scoring.
 */

// Skill keyword list shared across parse + matching
const KNOWN_SKILLS = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust', 'C++', 'C',
  'React', 'Vue.js', 'Angular', 'Next.js', 'Nuxt.js', 'React Native',
  'Node.js', 'Express', 'Fastify', 'NestJS', 'FastAPI', 'Django', 'Flask', 'Spring Boot',
  'GraphQL', 'REST APIs', 'Apollo', 'gRPC',
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQLite', 'Snowflake',
  'AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes', 'Terraform',
  'CI/CD', 'Git', 'GitHub', 'DevOps', 'Linux',
  'TensorFlow', 'PyTorch', 'scikit-learn', 'pandas', 'NumPy',
  'LangChain', 'OpenAI', 'Machine Learning', 'Deep Learning', 'NLP',
  'Redux', 'Zustand', 'Jotai', 'MobX',
  'CSS', 'Tailwind CSS', 'Sass', 'Styled Components',
  'Figma', 'Storybook', 'Accessibility', 'WCAG',
  'Stripe', 'Twilio', 'Elasticsearch', 'WebSockets',
  'Agile', 'Scrum', 'Leadership', 'System Design',
  'Vite', 'Webpack', 'Rollup', 'Babel',
];

/**
 * Extract skills found in raw resume text.
 * @param {string} resumeText
 * @returns {string[]}
 */
function extractSkillsFromText(resumeText) {
  if (!resumeText || typeof resumeText !== 'string') return [];
  const lower = resumeText.toLowerCase();
  return KNOWN_SKILLS.filter((skill) => lower.includes(skill.toLowerCase()));
}

/**
 * Calculate how well a single job matches the candidate's resume.
 *
 * @param {object} job        - Job object
 * @param {string} resumeText - Raw resume text
 * @returns {{ match_score: number, match_explanation: string, matched_skills: string[], skill_gap: string[] }}
 */
async function calculateMatch(job, resumeText) {
  // If we have an AI key, use AI matching
  if (process.env.GEMINI_API_KEY) {
    try {
      return await calculateAIMatch(job, resumeText);
    } catch (err) {
      console.warn('⚠️  Gemini AI Match failed, falling back to keywords:', err.message);
    }
  }

  // Fallback to keyword matching
  const resumeSkills = extractSkillsFromText(resumeText);
  const jobSkills    = Array.isArray(job.skills) ? job.skills : [];

  const matched  = jobSkills.filter((s) =>
    resumeSkills.some((r) => r.toLowerCase() === s.toLowerCase())
  );
  const skillGap = jobSkills.filter((s) =>
    !resumeSkills.some((r) => r.toLowerCase() === s.toLowerCase())
  );

  let score = jobSkills.length > 0
    ? Math.round((matched.length / jobSkills.length) * 100)
    : job.match_score ?? 0;

  return {
    match_score:        score,
    match_explanation:  matched.length > 0
      ? `You match ${matched.length} of ${jobSkills.length} required keywords.`
      : 'No direct keyword overlap detected.',
    matched_skills:     matched,
    skill_gap:          skillGap,
  };
}

/**
 * Individual AI matching using Gemini wrapped in LangChain
 */
async function calculateAIMatch(job, resumeText) {
  const model = new ChatGoogleGenerativeAI({
    modelName: "gemini-1.5-flash",
    apiKey: process.env.GEMINI_API_KEY,
    temperature: 0,
    maxRetries: 2,
  });

  const promptTemplate = new PromptTemplate({
    template: `Evaluate how well the candidate's resume matches this job description.
Job Title: {jobTitle}
Company: {company}
Description: {jobDescription}

Candidate Resume:
{resumeText}

Return valid JSON exactly matching this format:
{{
  "match_score": number (0-100),
  "match_explanation": "brief, 1-2 sentences",
  "matched_skills": ["skill1", "skill2"],
  "skill_gap": ["skill3", "skill4"]
}}`,
    inputVariables: ["jobTitle", "company", "jobDescription", "resumeText"],
  });

  const chain = promptTemplate.pipe(model).pipe(new StringOutputParser());

  const responseText = await chain.invoke({
    jobTitle: job.title || "Unknown",
    company: job.company || "Unknown",
    jobDescription: job.description || "",
    resumeText: resumeText || "",
  });

  const cleanedStr = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const parsed = JSON.parse(cleanedStr);
  
  // Ensure the response matches expected format
  return {
    match_score: parsed.match_score ?? 0,
    match_explanation: parsed.match_explanation || "AI matching completed.",
    matched_skills: parsed.matched_skills || [],
    skill_gap: parsed.skill_gap || []
  };
}

/**
 * Batch AI matching to improve performance
 * @param {object[]} jobs
 * @param {string} resumeText
 * @returns {Promise<object[]>} enriched jobs
 */
async function batchCalculateMatches(jobs, resumeText) {
  if (!process.env.GEMINI_API_KEY) {
    // Sequential fallback if no key (though this should be checked by caller)
    const enriched = [];
    for (const job of jobs) enriched.push({ ...job, ...(await calculateMatch(job, resumeText)) });
    return enriched;
  }

  const BATCH_SIZE = 10;
  const enriched = [];

  for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
    const batch = jobs.slice(i, i + BATCH_SIZE);
    console.log(`🧠 AI Matching Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(jobs.length / BATCH_SIZE)}...`);
    
    try {
      const model = new ChatGoogleGenerativeAI({
        modelName: "gemini-1.5-flash",
        apiKey: process.env.GEMINI_API_KEY,
        temperature: 0,
        maxRetries: 2,
      });

      const promptTemplate = new PromptTemplate({
        template: `Evaluate how well the candidate's resume matches these {batchSize} jobs.
      
Candidate Resume:
{resumeText}

Jobs to Evaluate:
{jobsData}

Return JSON array of EXACTLY {batchSize} objects corresponding to each job:
[
  {{
    "match_score": number, 
    "match_explanation": string, 
    "matched_skills": string[], 
    "skill_gap": string[]
  }}
]`,
        inputVariables: ["batchSize", "resumeText", "jobsData"],
      });

      const chain = promptTemplate.pipe(model).pipe(new StringOutputParser());

      const jobsDataStr = batch.map((j, idx) => `ID ${idx}: ${j.title} at ${j.company}\nDescription: ${j.description}`).join('\n---\n');

      const responseText = await chain.invoke({
        batchSize: batch.length,
        resumeText: resumeText,
        jobsData: jobsDataStr
      });

      const cleanedStr = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const resData = JSON.parse(cleanedStr);

      if (Array.isArray(resData)) {
        batch.forEach((job, idx) => {
          enriched.push({ ...job, ...(resData[idx] || {}) });
        });
      } else {
        throw new Error("Invalid AI batch response");
      }
    } catch (err) {
      console.warn(`⚠️  AI Batch fail at index ${i}, falling back to individual scoring:`, err.message);
      for (const job of batch) enriched.push({ ...job, ...(await calculateMatch(job, resumeText)) });
    }
  }

  return enriched;
}

/**
 * Return the top N best-matched jobs (match_score > 70), sorted descending.
 */
function getBestMatches(jobs, limit = 8) {
  return jobs
    .filter((j) => (j.match_score ?? 0) > 70)
    .sort((a, b) => (b.match_score ?? 0) - (a.match_score ?? 0))
    .slice(0, limit);
}

module.exports = { calculateMatch, getBestMatches, extractSkillsFromText, batchCalculateMatches, KNOWN_SKILLS };
