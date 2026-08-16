import assert from "node:assert/strict";
import test from "node:test";

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;

test("renders the public landing page with development preview metadata", async () => {
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
  assert.match(html, developmentPreviewMeta);
  assert.match(html, /From session brief/i);
  assert.match(html, /Create your workspace/i);
  assert.match(html, /Log in/i);
  assert.match(html, /Sign up/i);
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
  assert.match(loginHtml, /Log in to SetCraft/i);
  assert.match(loginHtml, /Email address/i);

  const signupResponse = await worker.fetch(
    new Request("http://localhost/signup", { headers: { accept: "text/html" } }),
    env,
    ctx,
  );
  assert.equal(signupResponse.status, 200);
  const signupHtml = await signupResponse.text();
  assert.match(signupHtml, /Tell us about your coaching world/i);
  assert.match(signupHtml, /Full name/i);
  assert.match(signupHtml, /Swim club/i);
  assert.match(signupHtml, /Primary course/i);
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
