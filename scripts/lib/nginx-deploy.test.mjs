import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readlinkSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";

const root = resolve(import.meta.dirname, "../..");
const sha = "a".repeat(40);
const files = [
  ["00-capsule-zero.conf", "/etc/nginx/conf.d/00-capsule-zero.conf"],
  ["00-cz-hardening.conf", "/etc/nginx/conf.d/00-cz-hardening.conf"],
  ["cz-request-guard.conf", "/etc/nginx/snippets/cz-request-guard.conf"],
  ["00-default-deny.conf", "/etc/nginx/sites-available/00-default-deny.conf"],
  ["capsulezero.app.conf", "/etc/nginx/sites-available/capsulezero.app.conf"],
];

function fixture() {
  const directory = mkdtempSync(join(tmpdir(), "nginx-deploy-"));
  const app = join(directory, "opt/capsule-zero");
  const bin = join(directory, "bin");
  const path = (absolute) => join(directory, absolute);
  const put = (target, content) => {
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content);
  };
  mkdirSync(bin);
  mkdirSync(join(directory, "backups"));
  mkdirSync(join(app, ".git"), { recursive: true });
  cpSync(join(root, "infra/nginx-host"), join(app, "infra/nginx-host"), {
    recursive: true,
  });
  put(join(app, ".env"), "# isolated fixture, no credentials\n");
  put(path("/var/lib/capsule-zero/last-host-nginx-sync-sha"), `${sha}\n`);
  for (const [name, destination] of files)
    put(path(destination), `old ${name}\n`);
  mkdirSync(path("/etc/nginx/sites-enabled"));
  symlinkSync(
    "/old/missing.conf",
    path("/etc/nginx/sites-enabled/capsulezero.app.conf"),
  );
  put(path("/etc/nginx/sites-enabled/default"), "old default\n");
  for (const absolute of [
    "/etc/letsencrypt/live/capsulezero.app/cert.pem",
    "/etc/letsencrypt/live/capsulezero.app/chain.pem",
    "/etc/ssl/certs",
  ])
    put(path(absolute), "fixture certificate input\n");
  put(
    path("/usr/local/libexec/capsule-zero/check-kratos-rollback-boundary"),
    "#!/bin/sh\nexit 0\n",
  );
  const checker = path(
    "/usr/local/libexec/capsule-zero/check-kratos-rollback-boundary",
  );
  // chmod via the filesystem, never through a real privileged command.
  const stub = `#!${process.execPath}
const fs = require('node:fs');
const name = require('node:path').basename(process.argv[1]);
const args = process.argv.slice(2);
fs.appendFileSync(process.env.NGINX_TEST_LOG, JSON.stringify([name,...args])+'\\n');
if (name === 'id') console.log('0');
if (name === 'mktemp') console.log(fs.mkdtempSync(process.env.NGINX_TEST_BACKUPS+'/backup-'));
if (name === 'cp') {
 if (process.env.NGINX_TEST_FAILURE === 'restore-file' && args[1].startsWith(process.env.NGINX_TEST_BACKUPS)) process.exit(1);
 const result = require('node:child_process').spawnSync('/bin/cp', args, {stdio:'inherit'});
 process.exit(result.status ?? 1);
}
if (name === 'docker' && args[0] === 'inspect') console.log('healthy');
if (name === 'docker' && args.includes('-q')) console.log('fixture-container');
if (name === 'openssl' && process.env.NGINX_TEST_FAILURE === 'certificate') process.exit(1);
if (name === 'nginx' || name === 'systemctl') {
 const countFile = process.env.NGINX_TEST_LOG+'.'+name;
 const count = fs.existsSync(countFile) ? Number(fs.readFileSync(countFile,'utf8')) : 0;
 fs.writeFileSync(countFile,String(count+1));
 if ((name === 'nginx' && ['syntax','restore-file'].includes(process.env.NGINX_TEST_FAILURE) && count === 0) ||
     (name === 'systemctl' && process.env.NGINX_TEST_FAILURE === 'reload' && count === 0) ||
     (name === 'nginx' && process.env.NGINX_TEST_FAILURE === 'restore')) process.exit(1);
}
if (name === 'curl') {
 if (process.env.NGINX_TEST_FAILURE === 'smoke') process.exit(1);
 if (args.includes('DELETE')) process.stdout.write(process.env.NGINX_TEST_FAILURE === 'method' ? '405' : '401');
}
`;
  for (const command of [
    "id",
    "git",
    "docker",
    "openssl",
    "nginx",
    "systemctl",
    "curl",
    "mktemp",
    "cp",
  ]) {
    writeFileSync(join(bin, command), stub, { mode: 0o700 });
  }
  chmodSync(checker, 0o700);
  const wrapper = join(directory, "wrapper");
  let source = readFileSync(
    join(root, "infra/scripts/capsule-zero-deploy"),
    "utf8",
  );
  for (const prefix of ["/opt/", "/etc/", "/var/lib/", "/usr/local/"]) {
    source = source.replaceAll(prefix, `${directory}${prefix}`);
  }
  writeFileSync(wrapper, source);
  return {
    directory,
    app,
    path,
    run(sync = true, failure = "") {
      const log = join(directory, "calls");
      writeFileSync(log, "");
      for (const name of ["nginx", "systemctl"])
        rmSync(`${log}.${name}`, { force: true });
      const result = spawnSync(
        "bash",
        [
          wrapper,
          `ghcr.io/kiaquila/capsule-zero-web:sha-${sha}`,
          `ghcr.io/kiaquila/capsule-zero-api:sha-${sha}`,
          sha,
          String(sync),
        ],
        {
          encoding: "utf8",
          timeout: 15_000,
          env: {
            ...process.env,
            PATH: `${bin}:${process.env.PATH}`,
            NGINX_TEST_BACKUPS: join(directory, "backups"),
            NGINX_TEST_LOG: log,
            NGINX_TEST_FAILURE: failure,
          },
        },
      );
      return {
        ...result,
        calls: readFileSync(log, "utf8")
          .trim()
          .split("\n")
          .filter(Boolean)
          .map(JSON.parse),
      };
    },
    close() {
      rmSync(directory, { recursive: true, force: true });
    },
  };
}

test("forward deploy repairs every managed file/link despite an up-to-date Git marker; same-SHA retry repairs new drift", () => {
  const f = fixture();
  try {
    for (let attempt = 0; attempt < 2; attempt++) {
      const result = f.run();
      assert.equal(result.status, 0, result.stderr);
      for (const [name, destination] of files) {
        assert.deepEqual(
          readFileSync(f.path(destination)),
          readFileSync(join(f.app, "infra/nginx-host", name)),
        );
      }
      for (const name of ["00-default-deny.conf", "capsulezero.app.conf"]) {
        assert.equal(
          readlinkSync(f.path(`/etc/nginx/sites-enabled/${name}`)),
          f.path(`/etc/nginx/sites-available/${name}`),
        );
      }
      assert.equal(
        existsSync(f.path("/etc/nginx/sites-enabled/default")),
        false,
      );
      assert.ok(
        result.calls.some(
          ([name, ...args]) => name === "curl" && args.includes("DELETE"),
        ),
      );
      assert.ok(result.calls.some(([name]) => name === "systemctl"));
      assert.deepEqual(readdirSync(join(f.directory, "backups")), []);
      writeFileSync(f.path(files[1][1]), "drift after deployment\n");
    }
  } finally {
    f.close();
  }
});

for (const failure of ["certificate", "syntax", "reload", "smoke", "method"]) {
  test(`${failure} failure restores prior contents, absent paths and broken symlinks, and fails deployment`, () => {
    const f = fixture();
    try {
      const result = f.run(true, failure);
      assert.notEqual(result.status, 0);
      for (const [name, destination] of files)
        assert.equal(
          readFileSync(f.path(destination), "utf8"),
          `old ${name}\n`,
        );
      assert.equal(
        readlinkSync(f.path("/etc/nginx/sites-enabled/capsulezero.app.conf")),
        "/old/missing.conf",
      );
      assert.equal(
        existsSync(f.path("/etc/nginx/sites-enabled/00-default-deny.conf")),
        false,
      );
      assert.equal(
        readFileSync(f.path("/etc/nginx/sites-enabled/default"), "utf8"),
        "old default\n",
      );
      assert.deepEqual(readdirSync(join(f.directory, "backups")), []);
      if (failure === "method")
        assert.match(result.stderr, /returned 405, expected 401/);
    } finally {
      f.close();
    }
  });
}

for (const failure of ["restore", "restore-file"]) {
  test(`failed restoration (${failure}) retains the backup and stops before reload`, () => {
    const f = fixture();
    try {
      const result = f.run(true, failure);
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /backup retained at/);
      assert.equal(readdirSync(join(f.directory, "backups")).length, 1);
      assert.equal(
        result.calls.some(([name]) => name === "systemctl"),
        false,
      );
    } finally {
      f.close();
    }
  });
}

test("image rollback leaves host nginx untouched and skips the newer session-route probe", () => {
  const f = fixture();
  try {
    const result = f.run(false);
    assert.equal(result.status, 0, result.stderr);
    for (const [name, destination] of files)
      assert.equal(readFileSync(f.path(destination), "utf8"), `old ${name}\n`);
    assert.ok(
      lstatSync(
        f.path("/etc/nginx/sites-enabled/capsulezero.app.conf"),
      ).isSymbolicLink(),
    );
    assert.equal(
      result.calls.some(([name]) => ["nginx", "systemctl"].includes(name)),
      false,
    );
    assert.equal(
      result.calls.some(
        ([name, ...args]) => name === "curl" && args.includes("DELETE"),
      ),
      false,
    );
  } finally {
    f.close();
  }
});
