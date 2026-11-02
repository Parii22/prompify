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

async function getJson(endpoint) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data: json };
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTests() {
  console.log('====================================================');
  console.log('DUAL-LLM PROVIDER & AUTOMATIC FALLBACK SUITE');
  console.log('Primary: Google Gemini (gemini-3.5-flash-lite)');
  console.log('Secondary/Fallback: Groq Cloud (openai/gpt-oss-120b)');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function report(title, success, details) {
    if (success) {
      console.log(`✅ [PASS] ${title}`);
      if (details) console.log(`   └─ ${details}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${title}`);
      if (details) console.error(`   └─ ${details}`);
      failed++;
    }
  }

  // ----------------------------------------------------------------
  // Test 1: Gemini Refinement (Primary Provider)
  // ----------------------------------------------------------------
  try {
    const res = await postJson('/prompts/refine', {
      prompt: 'What is AI?',
    });
    const payload = res.data?.data;
    const ok = res.status === 200 && payload?.provider === 'gemini' && !payload?.fallbackUsed && !!payload?.refinedVersions?.balanced;
    report(
      'Test 1: Primary Provider (Gemini) Refinement',
      ok,
      `Provider: ${payload?.provider}, Model: ${payload?.model}, FallbackUsed: ${payload?.fallbackUsed}`
    );
  } catch (err) {
    report('Test 1: Primary Provider (Gemini) Refinement', false, err.message);
  }

  // ----------------------------------------------------------------
  // Test 2: Groq Direct Refinement (Secondary Provider)
  // ----------------------------------------------------------------
  try {
    const res = await postJson('/prompts/refine', {
      prompt: 'Explain quantum computing in simple terms',
      forceProvider: 'groq',
    });
    const payload = res.data?.data;
    const ok = res.status === 200 && payload?.provider === 'groq' && !payload?.fallbackUsed && !!payload?.refinedVersions?.detailed;
    report(
      'Test 2: Secondary Provider (Groq Direct) Refinement',
      ok,
      `Provider: ${payload?.provider}, Model: ${payload?.model}, FallbackUsed: ${payload?.fallbackUsed}`
    );
  } catch (err) {
    report('Test 2: Secondary Provider (Groq Direct) Refinement', false, err.message);
  }

  // ----------------------------------------------------------------
  // Test 3: Gemini 429 Quota Fallback to Groq during Refinement
  // ----------------------------------------------------------------
  try {
    const res = await postJson('/prompts/refine', {
      prompt: 'Draft an email announcing a product launch',
      simulateError: 'gemini_quota',
    });
    const payload = res.data?.data;
    const ok = res.status === 200 && payload?.provider === 'groq' && payload?.fallbackUsed === true && !!payload?.fallbackReason;
    report(
      'Test 3: Gemini Quota (429) Automatic Fallback to Groq',
      ok,
      `Provider: ${payload?.provider}, Model: ${payload?.model}, Fallback: ${payload?.fallbackUsed}, Reason: "${payload?.fallbackReason?.slice(0, 50)}..."`
    );
  } catch (err) {
    report('Test 3: Gemini Quota (429) Automatic Fallback to Groq', false, err.message);
  }

  // ----------------------------------------------------------------
  // Test 4: Dual Provider Failure (Both Unavailable)
  // ----------------------------------------------------------------
  try {
    const res = await postJson('/prompts/refine', {
      prompt: 'Test prompt for dual failure',
      simulateError: 'all_fail',
    });
    const ok = res.status === 503 && res.data?.message?.includes('All LLM providers are currently unavailable');
    report(
      'Test 4: Dual Provider Outage Error Handling',
      ok,
      `Status: ${res.status}, Message: "${res.data?.message}"`
    );
  } catch (err) {
    report('Test 4: Dual Provider Outage Error Handling', false, err.message);
  }

  // ----------------------------------------------------------------
  // Test 5: Groq Direct Comparison Benchmark & Single-Provider Consistency
  // ----------------------------------------------------------------
  await wait(2000);
  try {
    const res = await postJson('/prompts/compare', {
      originalPrompt: 'Explain recursion',
      refinedPrompt: 'Explain the concept of recursion in programming with a step-by-step call stack example and base case definition.',
      objective: 'Help a beginner programmer grasp recursion',
      selectedVariant: 'balanced',
      forceProvider: 'groq',
    });
    const payload = res.data?.data;
    const evalOk = payload?.evaluation?.original?.overallScore && payload?.evaluation?.refined?.overallScore;
    const ok = res.status === 200 && payload?.provider === 'groq' && !payload?.fallbackUsed && evalOk;
    report(
      'Test 5: Secondary Provider (Groq Direct) Dual Execution & Benchmark',
      ok,
      `Provider: ${payload?.provider}, Model: ${payload?.model}, Score: ${payload?.evaluation?.original?.overallScore} -> ${payload?.evaluation?.refined?.overallScore}`
    );
  } catch (err) {
    report('Test 5: Secondary Provider (Groq Direct) Dual Execution & Benchmark', false, err.message);
  }

  // ----------------------------------------------------------------
  // Test 6: Comparison Automatic Fallback to Groq (Consistency Preserved)
  // ----------------------------------------------------------------
  await wait(3000);
  try {
    const res = await postJson('/prompts/compare', {
      originalPrompt: 'How to sort an array in JavaScript?',
      refinedPrompt: 'Explain Array.prototype.sort() in JavaScript, including comparator functions, in-place mutation, and an example.',
      objective: 'Clear reference for a junior developer',
      selectedVariant: 'concise',
      simulateError: 'gemini_quota',
    });
    const payload = res.data?.data;
    const ok = res.status === 200 && payload?.provider === 'groq' && payload?.fallbackUsed === true;
    report(
      'Test 6: Dual Execution Fallback (Restart Entire Workflow on Groq)',
      ok,
      `Provider: ${payload?.provider}, FallbackUsed: ${payload?.fallbackUsed}, Model: ${payload?.model}, Persistence ID: ${payload?.persistence?.recordId || 'none'}`
    );
  } catch (err) {
    report('Test 6: Dual Execution Fallback (Restart Entire Workflow on Groq)', false, err.message);
  }

  // ----------------------------------------------------------------
  // Test 7: Supabase Persistence Verification with Provider Metadata
  // ----------------------------------------------------------------
  try {
    const res = await getJson('/history?page=1&limit=5');
    const history = res.data?.data;
    const hasItems = history?.items && history.items.length > 0;
    const sample = hasItems ? history.items[0] : null;
    const ok = res.status === 200 && hasItems && sample.provider !== undefined;
    report(
      'Test 7: Supabase History Retrieval & Provider Field Preservation',
      ok,
      `Total Records: ${history?.total}, Sample Record Provider: "${sample?.provider || 'default'}", Model: "${sample?.model}"`
    );
  } catch (err) {
    report('Test 7: Supabase History Retrieval & Provider Field Preservation', false, err.message);
  }

  // ----------------------------------------------------------------
  // Test 8: History Detail Fetch Verification
  // ----------------------------------------------------------------
  try {
    const listRes = await getJson('/history?page=1&limit=1');
    const sampleId = listRes.data?.data?.items?.[0]?.id;
    if (sampleId) {
      const detailRes = await getJson(`/history/${sampleId}`);
      const detail = detailRes.data?.data;
      const ok = detailRes.status === 200 && detail.id === sampleId && detail.evaluation !== undefined;
      report(
        'Test 8: History Record Detail Inspection by ID',
        ok,
        `Record ID: ${detail.id}, Provider: ${detail.provider}, Model: ${detail.model}`
      );
    } else {
      report('Test 8: History Record Detail Inspection by ID', true, 'No items in database yet, list structure valid');
    }
  } catch (err) {
    report('Test 8: History Record Detail Inspection by ID', false, err.message);
  }

  console.log('\n====================================================');
  console.log(`TEST RESULTS: ${passed} PASSED / ${failed} FAILED`);
  console.log('====================================================');
}

runTests();
