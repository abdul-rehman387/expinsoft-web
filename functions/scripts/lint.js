// Runs this package's ESLint 8 with its own .eslintrc.js. Without the env flag,
// ESLint 8.57 finds the website's eslint.config.js one directory up, switches
// to flat-config mode and rejects `--ext`, which breaks the predeploy lint.
const {spawnSync} = require("child_process");
const path = require("path");

const root = path.join(__dirname, "..");
const bin = path.join(root, "node_modules", "eslint", "bin", "eslint.js");
const result = spawnSync(process.execPath, [bin, "--ext", ".js,.ts", "."], {
  cwd: root,
  stdio: "inherit",
  env: {...process.env, ESLINT_USE_FLAT_CONFIG: "false"},
});
process.exit(result.status === null ? 1 : result.status);
