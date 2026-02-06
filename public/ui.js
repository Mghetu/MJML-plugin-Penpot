const statusEl = document.getElementById("status");
const tagErrorEl = document.getElementById("tag-error");
const tagPropsEl = document.getElementById("tag-props");
const tagTypeEl = document.getElementById("tag-type");

const sendMessage = (type, payload = {}) => {
  parent.postMessage({ type, payload }, "*");
};

const appendStatus = (kind, message) => {
  const entry = document.createElement("div");
  entry.className = kind;
  entry.textContent = message;
  statusEl.prepend(entry);
};

const clearTagError = () => {
  tagErrorEl.style.display = "none";
  tagErrorEl.textContent = "";
};

const setTagError = (message) => {
  tagErrorEl.style.display = "inline-flex";
  tagErrorEl.className = "status error";
  tagErrorEl.textContent = message;
};

const safeJsonParse = (value) => {
  try {
    return [JSON.parse(value), null];
  } catch (error) {
    return [null, error];
  }
};

const escapeXml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const attrsFromPairs = (pairs) =>
  pairs
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => ` ${key}="${escapeXml(value)}"`)
    .join("");

const nodeToMjml = (node) => {
  if (!node) {
    return "";
  }

  const props = node.props || {};

  switch (node.type) {
    case "container": {
      const bodyAttrs = attrsFromPairs([
        ["background-color", props.backgroundColor],
        ["width", props.mjBodyWidth || props.width],
      ]);
      const children = (node.children || []).map(nodeToMjml).join("");
      return `<mjml><mj-body${bodyAttrs}>${children}</mj-body></mjml>`;
    }
    case "section": {
      const attrs = attrsFromPairs([
        ["padding", props.padding],
        ["background-color", props.backgroundColor],
      ]);
      const children = (node.children || []).map(nodeToMjml).join("");
      return `<mj-section${attrs}>${children}</mj-section>`;
    }
    case "column": {
      const attrs = attrsFromPairs([["width", props.width]]);
      const children = (node.children || []).map(nodeToMjml).join("");
      return `<mj-column${attrs}>${children}</mj-column>`;
    }
    case "text": {
      const attrs = attrsFromPairs([
        ["font-size", props.fontSize],
        ["align", props.align],
        ["padding", props.padding],
      ]);
      return `<mj-text${attrs}>${escapeXml(node.text || "")}</mj-text>`;
    }
    case "button": {
      const attrs = attrsFromPairs([
        ["href", props.href],
        ["align", props.align],
        ["padding", props.padding],
        ["background-color", props.backgroundColor],
        ["color", props.color],
        ["border-radius", props.borderRadius],
      ]);
      return `<mj-button${attrs}>${escapeXml(node.text || "Button")}</mj-button>`;
    }
    case "image": {
      const attrs = attrsFromPairs([
        ["src", props.src],
        ["alt", props.alt],
        ["href", props.href],
        ["padding", props.padding],
      ]);
      return `<mj-image${attrs} />`;
    }
    case "divider": {
      const attrs = attrsFromPairs([
        ["border-width", props.borderWidth],
        ["border-color", props.borderColor],
        ["padding", props.padding],
      ]);
      return `<mj-divider${attrs} />`;
    }
    case "spacer": {
      const attrs = attrsFromPairs([["height", props.height]]);
      return `<mj-spacer${attrs} />`;
    }
    default:
      return "";
  }
};

const triggerZipDownload = async (payload) => {
  const { ast, assets = [], warnings = [] } = payload;
  const mjml = nodeToMjml(ast);
  const zip = new JSZip();

  zip.file("index.mjml", mjml);

  if (assets.length > 0) {
    const assetsFolder = zip.folder("assets");
    assets.forEach((asset) => {
      const bytes = new Uint8Array(asset.bytes || []);
      assetsFolder.file(asset.name, bytes, { binary: true });
    });
  }

  const bytes = await zip.generateAsync({ type: "uint8array" });
  downloadFallback({
    name: "newsletterify-export.zip",
    bytes: Array.from(bytes),
    mimeType: "application/zip",
  });

  if (warnings.length > 0) {
    appendStatus("warning", `Exported with ${warnings.length} warnings.`);
  } else {
    appendStatus("info", "Export complete.");
  }
};

const buttonMap = [
  ["ping-button", "PING"],
  ["insert-container", "INSERT_CONTAINER"],
  ["insert-row", "INSERT_ROW"],
  ["insert-column", "INSERT_COLUMN"],
  ["insert-text", "INSERT_TEXT"],
  ["insert-button", "INSERT_BUTTON"],
  ["insert-image", "INSERT_IMAGE"],
  ["insert-divider", "INSERT_DIVIDER"],
  ["insert-spacer", "INSERT_SPACER"],
  ["export", "EXPORT_MJML"],
];

buttonMap.forEach(([id, type]) => {
  const button = document.getElementById(id);
  if (button) {
    button.addEventListener("click", () => sendMessage(type));
  }
});

const applyTagButton = document.getElementById("apply-tag");
applyTagButton.addEventListener("click", () => {
  clearTagError();
  const [props, error] = safeJsonParse(tagPropsEl.value || "{}");
  if (error) {
    setTagError("Invalid JSON props.");
    return;
  }
  sendMessage("TAG_SELECTION", {
    nlType: tagTypeEl.value,
    props,
  });
});

window.addEventListener("message", (event) => {
  const message = event.data;
  if (!message || typeof message.type !== "string") {
    return;
  }

  switch (message.type) {
    case "PONG":
      appendStatus("info", "Pong received.");
      break;
    case "INFO":
      appendStatus("info", message.payload?.message || "Info.");
      break;
    case "ERROR":
      appendStatus("error", message.payload?.message || "Error.");
      break;
    case "EXPORT_RESULT":
      triggerZipDownload(message.payload);
      break;
    default:
      break;
  }
});
