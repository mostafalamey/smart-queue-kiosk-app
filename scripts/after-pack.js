const fs = require("node:fs");
const path = require("node:path");
const rcedit = require("rcedit");

module.exports = async (context) => {
  if (context.electronPlatformName !== "win32") {
    return;
  }

  const productFilename = context.packager?.appInfo?.productFilename;
  if (!productFilename || !context.appOutDir) {
    return;
  }

  const executablePath = path.join(context.appOutDir, `${productFilename}.exe`);
  const iconPath = path.join(context.packager.projectDir, "build-resources", "icon.ico");

  if (!fs.existsSync(executablePath) || !fs.existsSync(iconPath)) {
    return;
  }

  await rcedit(executablePath, {
    icon: iconPath,
  });
};
