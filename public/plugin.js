const UI_URL = "https://mghetu.github.io/MJML-plugin-Penpot/public/index.html";

const NL_TYPE_KEY = "nl:type";
const NL_PROPS_KEY = "nl:props";
const NL_VERSION_KEY = "nl:version";
const NL_VERSION = "0.1";

penpot.ui.open("Newsletterify", UI_URL, { width: 360, height: 640 });

const sendInfo = (message) => {
  penpot.ui.sendMessage({ type: "INFO", payload: { message } });
};

const sendError = (message) => {
  penpot.ui.sendMessage({ type: "ERROR", payload: { message } });
};

const downloadFile = ({ name, bytes, mimeType }) => {
  const data = new Uint8Array(bytes || []);
  if (penpot.ui && typeof penpot.ui.download === "function") {
    penpot.ui.download({ name, data, mimeType });
    return;
  }
  if (typeof penpot.download === "function") {
    penpot.download({ name, data, mimeType });
    return;
  }
  throw new Error("Download API not available.");
};

const setNl = (shape, type, props = {}) => {
  shape.setPluginData(NL_TYPE_KEY, type);
  shape.setPluginData(NL_PROPS_KEY, JSON.stringify(props));
  shape.setPluginData(NL_VERSION_KEY, NL_VERSION);
};

const getNlType = (shape) => shape.getPluginData(NL_TYPE_KEY) || null;

const getNlProps = (shape) => {
  const raw = shape.getPluginData(NL_PROPS_KEY);
  if (!raw) {
    return {};
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    return {};
  }
};

const getSelection = () => penpot.selection || [];

const requireSelection = () => {
  const selection = getSelection();
  if (!selection || selection.length !== 1) {
    sendError("Select exactly one node.");
    return null;
  }
  return selection[0];
};

const createGroupIn = (parent, name) => {
  const a = penpot.createRectangle();
  const b = penpot.createRectangle();

  a.resize(10, 10);
  b.resize(10, 10);
  a.hidden = true;
  b.hidden = true;

  parent.appendChild(a);
  parent.appendChild(b);

  const group = penpot.group([a, b]);
  if (!group) {
    throw new Error("penpot.group() failed");
  }

  group.name = name;

  try {
    a.remove();
  } catch {}
  try {
    b.remove();
  } catch {}

  return group;
};

const findAncestorContainer = (node) => {
  let cur = node;
  while (cur) {
    if (cur.getPluginData(NL_TYPE_KEY) === "container") {
      return cur;
    }
    cur = cur.parent;
  }
  return null;
};

const getContainerFromSelectionOrThrow = () => {
  const selection = getSelection();
  if (!selection.length) {
    throw new Error("Select the container or something inside it.");
  }
  const container = findAncestorContainer(selection[0]);
  if (!container) {
    throw new Error("Selection is not inside a Newsletter Container.");
  }
  return container;
};

const createContainer = () => {
  const board = penpot.createBoard();
  board.name = "Newsletter Container";
  board.resize(600, 900);
  board.x = 0;
  board.y = 0;
  board.fills = [{ fillColor: "#ffffff" }];
  setNl(board, "container", {
    width: 600,
    backgroundColor: "#ffffff",
    mjBodyWidth: "600px",
  });
  penpot.selection = [board];
  sendInfo("Container inserted.");
};

const createSection = (container, props = { padding: "0px" }) => {
  const group = createGroupIn(container, "Section");
  const background = penpot.createRectangle();
  const sectionWidth = container?.width || 600;
  background.name = "Section Background";
  background.resize(sectionWidth, 40);
  background.fills = [{ fillColor: "#f5f5f5" }];
  group.appendChild(background);
  setNl(group, "section", { padding: "0px", backgroundColor: null, ...props });
  return group;
};

const createColumn = () => {
  const parent = requireSelection();
  if (!parent) {
    return;
  }
  if (getNlType(parent) !== "section") {
    sendError("Select a Section to insert a Column.");
    return;
  }
  const group = createGroupIn(parent, "Column");
  const background = penpot.createRectangle();
  background.name = "Column Background";
  background.resize(240, 40);
  background.fills = [{ fillColor: "#f0f0f0" }];
  group.appendChild(background);
  setNl(group, "column", { width: null });
  penpot.selection = [group];
  sendInfo("Column inserted.");
};

const requireColumnSelection = () => {
  const parent = requireSelection();
  if (!parent) {
    return null;
  }
  if (getNlType(parent) !== "column") {
    sendError("Select a Column before inserting a module.");
    return null;
  }
  return parent;
};

const insertText = () => {
  const parent = requireColumnSelection();
  if (!parent) {
    return;
  }
  const text = penpot.createText("Newsletter text");
  text.name = "Text";
  parent.appendChild(text);
  setNl(text, "text", { fontSize: 16, align: "left", padding: "0px" });
  penpot.selection = [text];
  sendInfo("Text inserted.");
};

const insertButton = () => {
  const parent = requireColumnSelection();
  if (!parent) {
    return;
  }
  const group = createGroupIn(parent, "Button");
  setNl(group, "button", {
    href: "https://example.com",
    align: "left",
    padding: "0px",
    backgroundColor: "#4c6fff",
    color: "#ffffff",
    borderRadius: "4px",
  });

  const rect = penpot.createRectangle();
  rect.resize(160, 40);
  rect.fills = [{ fillColor: "#4c6fff" }];
  rect.name = "Button Background";

  const label = penpot.createText("Button");
  label.name = "Button Label";
  label.x = 16;
  label.y = 10;
  label.fills = [{ fillColor: "#ffffff" }];

  group.appendChild(rect);
  group.appendChild(label);

  penpot.selection = [group];
  sendInfo("Button inserted.");
};

const insertImage = () => {
  const parent = requireColumnSelection();
  if (!parent) {
    return;
  }
  const rect = penpot.createRectangle();
  rect.name = "Image";
  rect.resize(300, 180);
  rect.fills = [{ fillColor: "#e0e0e0" }];
  parent.appendChild(rect);
  setNl(rect, "image", { alt: "Image", href: null, padding: "0px" });
  penpot.selection = [rect];
  sendInfo("Image placeholder inserted.");
};

const insertDivider = () => {
  const parent = requireColumnSelection();
  if (!parent) {
    return;
  }
  const rect = penpot.createRectangle();
  rect.name = "Divider";
  rect.resize(300, 1);
  rect.fills = [{ fillColor: "#dddddd" }];
  parent.appendChild(rect);
  setNl(rect, "divider", {
    borderWidth: "1px",
    borderColor: "#dddddd",
    padding: "0px",
  });
  penpot.selection = [rect];
  sendInfo("Divider inserted.");
};

const insertSpacer = () => {
  const parent = requireColumnSelection();
  if (!parent) {
    return;
  }
  const rect = penpot.createRectangle();
  rect.name = "Spacer";
  rect.resize(300, 24);
  rect.opacity = 0;
  parent.appendChild(rect);
  setNl(rect, "spacer", { height: 24 });
  penpot.selection = [rect];
  sendInfo("Spacer inserted.");
};

const tagSelection = (payload) => {
  const target = requireSelection();
  if (!target) {
    return;
  }
  const { nlType, props } = payload || {};
  if (!nlType) {
    sendError("Missing nlType for tagging.");
    return;
  }
  setNl(target, nlType, props || {});
  sendInfo(`Tagged selection as ${nlType}.`);
};

const buildAst = (node, warnings, nodeMap) => {
  const nlType = getNlType(node);
  if (!nlType) {
    return null;
  }

  const astNode = {
    type: nlType,
    id: node.id,
    name: node.name,
    props: getNlProps(node),
  };

  nodeMap.set(node.id, node);

  if (nlType === "text") {
    astNode.text = node.characters || node.text || node.name || "";
  }

  if (nlType === "button") {
    const labelChild = (node.children || []).find((child) => child.type === "text");
    astNode.text = labelChild?.characters || node.name || "Button";
  }

  if (nlType === "container") {
    const children = (node.children || []).map((child) => {
      if (getNlType(child) !== "section") {
        if (getNlType(child)) {
          warnings.push(`Unsupported child type in container: ${getNlType(child)}.`);
        }
        return null;
      }
      return buildAst(child, warnings, nodeMap);
    });
    astNode.children = children.filter(Boolean);
  }

  if (nlType === "section") {
    const columns = (node.children || [])
      .map((child) => {
        if (getNlType(child) !== "column") {
          if (getNlType(child)) {
            warnings.push(`Unsupported child type in section: ${getNlType(child)}.`);
          }
          return null;
        }
        return buildAst(child, warnings, nodeMap);
      })
      .filter(Boolean);

    if (columns.length === 0) {
      warnings.push(`Section "${node.name}" has no columns.`);
    }

    astNode.children = columns;
  }

  if (nlType === "column") {
    const leaves = (node.children || [])
      .map((child) => {
        const childType = getNlType(child);
        if (!childType) {
          warnings.push(`Untagged child ignored in column: ${child.name}.`);
          return null;
        }
        if (["text", "button", "image", "divider", "spacer"].includes(childType)) {
          return buildAst(child, warnings, nodeMap);
        }
        warnings.push(`Unsupported tagged type ignored: ${childType}.`);
        return null;
      })
      .filter(Boolean);

    astNode.children = leaves;
  }

  return astNode;
};

const exportMjml = async () => {
  const container = requireSelection();
  if (!container) {
    return;
  }
  if (getNlType(container) !== "container") {
    sendError("Select a Container to export.");
    return;
  }

  const warnings = [];
  const nodeMap = new Map();
  const ast = buildAst(container, warnings, nodeMap);
  const assets = [];

  const imageNodes = [];
  const collectImages = (node) => {
    if (!node) {
      return;
    }
    if (node.type === "image") {
      imageNodes.push(node);
    }
    (node.children || []).forEach(collectImages);
  };

  collectImages(ast);

  for (let index = 0; index < imageNodes.length; index += 1) {
    const imageNode = imageNodes[index];
    const shape = nodeMap.get(imageNode.id);
    if (!shape || typeof shape.export !== "function") {
      warnings.push(`Could not export image for node ${imageNode.name}.`);
      continue;
    }
    const bytes = await shape.export({ type: "png", scale: 1 });
    const name = `image-${String(index + 1).padStart(3, "0")}.png`;
    assets.push({ name, bytes: Array.from(bytes) });
    imageNode.props = {
      ...imageNode.props,
      src: `assets/${name}`,
    };
  }

  penpot.ui.sendMessage({
    type: "EXPORT_RESULT",
    payload: { ast, assets, warnings },
  });
};

penpot.ui.onMessage(async (message) => {
  try {
    if (!message || typeof message.type !== "string") {
      return;
    }

    switch (message.type) {
      case "PING":
        penpot.ui.sendMessage({ type: "PONG" });
        break;
      case "INSERT_CONTAINER":
        createContainer();
        break;
      case "INSERT_ROW": {
        const container = getContainerFromSelectionOrThrow();
        const section = createSection(container, { padding: "0px" });
        penpot.selection = [section];
        sendInfo("Row inserted.");
        break;
      }
      case "INSERT_COLUMN":
        createColumn();
        break;
      case "INSERT_TEXT":
        insertText();
        break;
      case "INSERT_BUTTON":
        insertButton();
        break;
      case "INSERT_IMAGE":
        insertImage();
        break;
      case "INSERT_DIVIDER":
        insertDivider();
        break;
      case "INSERT_SPACER":
        insertSpacer();
        break;
      case "TAG_SELECTION":
        tagSelection(message.payload);
        break;
      case "EXPORT_MJML":
        await exportMjml();
        break;
      case "DOWNLOAD_FILE":
        downloadFile(message.payload || {});
        break;
      default:
        break;
    }
  } catch (error) {
    sendError(String(error?.message || error));
  }
});
