import {
  getBlockContentByUid,
  getTreeByUid,
  processNotesInTree,
} from "./utils";
//import { addObserver, disconnectObserver } from "./observers";

import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import { initializeOpenAIAPI } from "./openai";

export let OPENAI_API_KEY = "";

function mountComponent() {
  const container = document.getElementsByClassName(
    "speech-to-roam-container"
  )[0];
  let currentBlockUid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
  ReactDOM.render(<App blockUid={currentBlockUid} />, container);
}

function createContainer() {
  const rootPosition =
    document.getElementsByClassName("rm-sync")[0].parentNode.parentNode;
  const newSpan = document.createElement("span");
  newSpan.classList.add("speech-to-roam-container");
  rootPosition.parentNode.insertBefore(newSpan, rootPosition);
}

function removeContainer() {
  const container = document.getElementsByClassName(
    "speech-to-roam-container"
  )[0];
  container.remove();
}

const panelConfig = {
  tabTitle: "___",
  settings: [
    {
      id: "openaiapi",
      name: "OpenAI API Key",
      description: "Copy here your OpenAI API key",
      action: {
        type: "input",
        onChange: (evt) => {
          OPENAI_API_KEY = evt.target.value;
        },
      },
    },
    // // SWITCH example
    // {
    //   id: "insertLine",
    //   name: "Insert a line above footnotes header",
    //   description:
    //     "Insert a block drawing a line just above the footnotes header, at the bottom of the page:",
    //   action: {
    //     type: "switch",
    //     onChange: (evt) => {
    //       // insertLineBeforeFootnotes = !insertLineBeforeFootnotes;
    //     },
    //   },
    // },
    // // SELECT example
    // {
    //   id: "hotkeys",
    //   name: "Hotkeys",
    //   description: "Hotkeys to insert/delete footnote",
    //   action: {
    //     type: "select",
    //     items: ["Ctrl + Alt + F", "Ctrl + Shift + F"],
    //     onChange: (evt) => {
    //       // secondHotkey = getHotkeys(evt);
    //     },
    //   },
    // },
  ],
};

export default {
  onload: async ({ extensionAPI }) => {
    extensionAPI.settings.panel.create(panelConfig);

    // get settings from setting panel
    if (extensionAPI.settings.get("openaiapi") === null)
      extensionAPI.settings.set("openaiapi", "");
    OPENAI_API_KEY = await extensionAPI.settings.get("openaiapi");
    initializeOpenAIAPI();
    createContainer();

    window.roamAlphaAPI.ui.commandPalette.addCommand({
      label: "Speech to Roam",
      callback: () => {
        mountComponent();
      },
    });

    // Add command to block context menu
    // roamAlphaAPI.ui.blockContextMenu.addCommand({
    //   label: "Color Highlighter: Remove color tags",
    //   "display-conditional": (e) => e["block-string"].includes("#c:"),
    //   callback: (e) => removeHighlightsFromBlock(e["block-uid"], removeOption),
    // });

    // Add SmartBlock command
    // const insertCmd = {
    //   text: "INSERTFOOTNOTE",
    //   help: "Insert automatically numbered footnote (requires the Footnotes extension)",
    //   handler: (context) => () => {
    //     noteInline = null;
    //     currentPos = new position();
    //     currentPos.s = context.currentContent.length;
    //     currentPos.e = currentPos.s;
    //     insertOrRemoveFootnote(context.targetUid);
    //     return "";
    //   },
    // };
    // if (window.roamjs?.extension?.smartblocks) {
    //   window.roamjs.extension.smartblocks.registerCommand(insertCmd);
    // } else {
    //   document.body.addEventListener(`roamjs:smartblocks:loaded`, () => {
    //     window.roamjs?.extension.smartblocks &&
    //       window.roamjs.extension.smartblocks.registerCommand(insertCmd);
    //   });
    // }

    // addObserver();

    console.log("Extension loaded.");
    //return;
  },
  onunload: () => {
    removeContainer();
    // disconnectObserver();

    // window.roamAlphaAPI.ui.commandPalette.removeCommand({
    //   label: "Footnotes: Reorder footnotes on current page",
    // });

    // roamAlphaAPI.ui.blockContextMenu.removeCommand({
    //   label: "Color Highlighter: Remove color tags",
    // });
    console.log("Extension unloaded");
  },
};
