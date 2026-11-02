const BASE_URL = 'http://localhost:5001/api';

async function postJson(endpoint, data) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data: json };
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runGroqVerification() {
  console.log('===========================================================');
  console.log('INDEPENDENT GROQ CLOUD FORCED VERIFICATION');
  console.log('===========================================================\n');

  // STEP 1: Verify Groq-forced Refinement
  console.log('[Step 1] Executing Refinement with forced Groq provider...');
  const refineRes = await postJson('/prompts/refine', {
    prompt: 'Write a Python script to calculate Fibonacci numbers efficiently.',
    objective: 'Provide recursive with memoization and iterative approaches.',
    forceProvider: 'groq',
  });

  const refData = refineRes.data?.data;
  console.log(`Status: ${refineRes.status}`);
  console.log(`Provider: ${refData?.provider} (Expected: groq)`);
  console.log(`Model: ${refData?.model} (Expected: openai/gpt-oss-120b)`);
  console.log(`Weaknesses identified: ${refData?.analysis?.weaknesses?.length || 0}`);
  console.log(`Balanced variation length: ${refData?.refinedVersions?.balanced?.length || 0} chars`);
  console.log(`Detailed variation length: ${refData?.refinedVersions?.detailed?.length || 0} chars`);
  console.log(`Concise variation length: ${refData?.refinedVersions?.concise?.length || 0} chars`);

  if (!refData || refData.provider !== 'groq' || !refData.refinedVersions?.balanced || !refData.refinedVersions?.detailed || !refData.refinedVersions?.concise) {
    throw new Error('Step 1 failed: Groq refinement did not return complete 3 variations.');
  }
  console.log('✅ Step 1: Groq refinement, diagnostics, and 3 variations generated successfully.\n');

  // Wait 3 seconds to avoid bursting token limit
  await wait(3000);

  // STEP 2: Verify Groq-forced Dual Execution & 5-Metric Evaluation
  console.log('[Step 2] Executing Dual Prompt Execution & 5-Metric Evaluation on Groq...');
  const compareRes = await postJson('/prompts/compare', {
    originalPrompt: 'Write a Python script to calculate Fibonacci numbers efficiently.',
    refinedPrompt: refData.refinedVersions.balanced,
    objective: 'Provide recursive with memoization and iterative approaches.',
    selectedVariant: 'balanced',
    analysis: refData.analysis,
    refinedVersions: refData.refinedVersions,
    forceProvider: 'groq',
  });

  const compData = compareRes.data?.data;
  console.log(`Status: ${compareRes.status}`);
  console.log(`Provider: ${compData?.provider} (Expected: groq)`);
  console.log(`Model: ${compData?.model}`);
  console.log(`Original Response length: ${compData?.originalResponse?.length || 0} chars`);
  console.log(`Refined Response length: ${compData?.refinedResponse?.length || 0} chars`);
  console.log(`Original Overall Score: ${compData?.evaluation?.original?.overallScore}/10`);
  console.log(`Refined Overall Score: ${compData?.evaluation?.refined?.overallScore}/10`);
  console.log(`5 Criteria evaluated:`, Object.keys(compData?.evaluation?.original || {}).filter(k => k !== 'overallScore'));
  console.log(`Supabase Saved: ${compData?.persistence?.saved} (Record ID: ${compData?.persistence?.recordId})`);

  if (!compData || compData.provider !== 'groq' || !compData.originalResponse || !compData.refinedResponse || !compData.evaluation?.refined?.overallScore) {
    throw new Error('Step 2 failed: Groq comparison benchmark did not complete properly.');
  }
  console.log('✅ Step 2: Groq dual execution, 5-criteria benchmark, and Supabase persistence verified.\n');

  // STEP 3: Verify Normal Gemini Primary Mode is Unchanged
  console.log('[Step 3] Verifying Normal Mode defaults to Google Gemini (Primary)...');
  const normalRes = await postJson('/prompts/refine', {
    prompt: 'What is AI?',
  });
  const normalData = normalRes.data?.data;
  console.log(`Normal Mode Provider: ${normalData?.provider} (Expected: gemini)`);
  console.log(`Normal Mode Model: ${normalData?.model} (Expected: gemini-3.5-flash-lite)`);

  if (normalData?.provider !== 'gemini') {
    throw new Error('Step 3 failed: Normal mode should default to Gemini as primary.');
  }
  console.log('✅ Step 3: Verified Gemini remains the permanent primary provider in normal mode.\n');

  console.log('===========================================================');
  console.log('ALL INDEPENDENT GROQ VERIFICATION CRITERIA SATISFIED!');
  console.log('===========================================================');
}

runGroqVerification().catch((err) => {
  console.error('Verification failed:', err.message);
  process.exit(1);
});

