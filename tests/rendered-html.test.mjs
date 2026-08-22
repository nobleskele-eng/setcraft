import assert from "node:assert/strict";
import test from "node:test";

const canonicalHome =
  /<link(?=[^>]*\brel=["']canonical["'])(?=[^>]*\bhref=["']https:\/\/lanelab\.studio\/?["'])[^>]*>/i;

test("renders the public LaneLab landing page with production metadata", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  const html = await response.text();
  assert.match(html, canonicalHome);
  assert.match(html, /LaneLab — Swim Performance Studio/i);
  assert.match(html, /From session brief/i);
  assert.match(html, /Create your workspace/i);
  assert.match(html, /Log in/i);
  assert.match(html, /Sign up/i);
  assert.match(html, /Terms/i);
  assert.match(html, /Privacy/i);
  assert.match(html, /Questions before/i);
  assert.doesNotMatch(html, /Home Dashboard/i);
});

test("redirects anonymous studio visits to login", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("authenticated-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/studio", {
      headers: { accept: "text/html" },
    }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );

  assert.ok([302, 303, 307, 308].includes(response.status));
  assert.equal(new URL(response.headers.get("location")).pathname, "/login");
});

test("renders complete login and sign-up routes", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("account-routes-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const env = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
  const ctx = { waitUntil() {}, passThroughOnException() {} };

  const loginResponse = await worker.fetch(
    new Request("http://localhost/login", { headers: { accept: "text/html" } }),
    env,
    ctx,
  );
  assert.equal(loginResponse.status, 200);
  const loginHtml = await loginResponse.text();
  assert.match(loginHtml, /Log in to LaneLab/i);
  assert.match(loginHtml, /Email address/i);
  assert.match(loginHtml, /Forgot password/i);

  const signupResponse = await worker.fetch(
    new Request("http://localhost/signup", { headers: { accept: "text/html" } }),
    env,
    ctx,
  );
  assert.equal(signupResponse.status, 200);
  const signupHtml = await signupResponse.text();
  assert.match(signupHtml, /Tell us about your coaching world/i);
  assert.match(signupHtml, /Full name/i);
  assert.match(signupHtml, /Repeat password/i);
  assert.match(signupHtml, /Swim club/i);
  assert.match(signupHtml, /Primary course/i);
  assert.match(signupHtml, /Terms of Service/i);
  assert.match(signupHtml, /Privacy Policy/i);
});

test("renders the public trust and account-recovery pages", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("trust-routes-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const env = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
  const ctx = { waitUntil() {}, passThroughOnException() {} };
  const expectations = [
    ["/terms", /Coaching and athlete responsibility/i],
    ["/privacy", /AI prompts and image processing/i],
    ["/contact", /Start with the/i],
    ["/forgot-password", /Forgot your password/i],
    ["/reset-password", /Create a new password/i],
  ];
  for (const [path, pattern] of expectations) {
    const response = await worker.fetch(new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }), env, ctx);
    assert.equal(response.status, 200, path);
    assert.match(await response.text(), pattern, path);
  }
});

test("rejects mismatched sign-up and reset passwords before storage", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("password-validation-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const env = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
  const ctx = { waitUntil() {}, passThroughOnException() {} };

  const signup = await worker.fetch(new Request("http://localhost/api/auth/signup", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ fullName: "Taylor Coach", email: "coach@example.com", password: "StrongPass2026", confirmPassword: "DifferentPass2026", termsAccepted: "yes" }) }), env, ctx);
  assert.equal(signup.status, 400);
  assert.match(await signup.text(), /Passwords do not match/i);

  const reset = await worker.fetch(new Request("http://localhost/api/auth/reset-password", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token: "invalid", password: "StrongPass2026", confirmPassword: "StrongPass2026" }) }), env, ctx);
  assert.equal(reset.status, 400);
  assert.match(await reset.text(), /invalid or has expired/i);
});

test("rejects anonymous Gemini requests", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("api-auth-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/api/gemini/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messages: [{ sender: "user", text: "Hello" }] }),
    }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );

  assert.equal(response.status, 401);
  assert.match(await response.text(), /Authentication required/i);
});
