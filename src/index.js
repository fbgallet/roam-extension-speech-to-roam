import {
  getBlockContentByUid,
  getTreeByUid,
  processNotesInTree,
} from "./utils";
//import { addObserver, disconnectObserver } from "./observers";

import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import { initializeOpenAIAPI, supportedLanguage } from "./openai";

export let OPENAI_API_KEY = "";
export let isUsingWhisper;
export let transcriptionLanguage;
export let whisperPrompt;
export let isTranslateIconDisplayed;

function mountComponent(props) {
  const container = document.getElementsByClassName(
    "speech-to-roam-container"
  )[0];
  if (!props) {
    props = {};
    props.transcribeOnly = isTranslateIconDisplayed ? false : true;
  }
  let currentBlockUid = window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
  ReactDOM.render(<App blockUid={currentBlockUid} {...props} />, container);
}

function unmountComponent() {
  const node = document.getElementsByClassName("speech-to-roam-container")[0];
  ReactDOM.unmountComponentAtNode(node);
}

function createContainer() {
  // const rootPosition =
  //   document.getElementsByClassName("rm-sync")[0].parentNode.parentNode;
  const rootPosition = document.getElementsByClassName("rm-topbar")[0];
  const newSpan = document.createElement("span");
  newSpan.classList.add("speech-to-roam-container");
  // rootPosition.parentNode.insertBefore(newSpan, rootPosition);
  rootPosition.insertBefore(newSpan, rootPosition.firstChild);
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
      id: "whisper",
      name: "Use Whisper API",
      description:
        "Use Whisper API (paid service) for transcription. If disabled, free system speech recognition will be used:",
      action: {
        type: "switch",
        onChange: (evt) => {
          isUsingWhisper = !isUsingWhisper;
        },
      },
    },
    {
      id: "openaiapi",
      name: "OpenAI API Key",
      description: "Copy here your OpenAI API key",
      action: {
        type: "input",
        onChange: (evt) => {
          OPENAI_API_KEY = evt.target.value;
          initializeOpenAIAPI();
        },
      },
    },
    {
      id: "transcriptionLgg",
      name: "Transcription language",
      description:
        "You can enter your language code (ISO 639-1) for better transcription (option):",
      action: {
        type: "input",
        onChange: (evt) => {
          const lgg = evt.target.value.toLowerCase().trim();
          transcriptionLanguage = supportedLanguage.includes(lgg) ? lgg : "";
        },
      },
    },
    {
      id: "prompt",
      name: "Prompt for Whisper",
      description:
        "You can enter a list of specific words or proper nouns for better recognition and spelling:",
      action: {
        type: "input",
        onChange: (evt) => {
          whisperPrompt = evt.target.value.trim();
        },
      },
    },
    {
      id: "translateIcon",
      name: "Translate Icon",
      description: "Always display translate icon:",
      action: {
        type: "switch",
        onChange: (evt) => {
          isTranslateIconDisplayed = !isTranslateIconDisplayed;
          unmountComponent();
          mountComponent();
        },
      },
    },
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
    if (extensionAPI.settings.get("whisper") === null)
      extensionAPI.settings.set("whisper", true);
    isUsingWhisper = await extensionAPI.settings.get("whisper");
    if (extensionAPI.settings.get("openaiapi") === null)
      extensionAPI.settings.set("openaiapi", "");
    OPENAI_API_KEY = await extensionAPI.settings.get("openaiapi");
    if (extensionAPI.settings.get("transcriptionLgg") === null)
      extensionAPI.settings.set("transcriptionLgg", "");
    transcriptionLanguage = await extensionAPI.settings.get("transcriptionLgg");
    if (extensionAPI.settings.get("prompt") === null)
      extensionAPI.settings.set("prompt", "");
    whisperPrompt = await extensionAPI.settings.get("prompt");
    if (extensionAPI.settings.get("translateIcon") === null)
      extensionAPI.settings.set("translateIcon", true);
    isTranslateIconDisplayed = await extensionAPI.settings.get("translateIcon");
    initializeOpenAIAPI();
    createContainer();

    extensionAPI.ui.commandPalette.addCommand({
      label: "Speech-to-Roam: record & transcribe voice",
      callback: () => {
        document.getElementsByClassName("speech-record-button")
          ? (unmountComponent(),
            mountComponent({ startRecording: true, transcribeOnly: true }))
          : mountComponent();
      },
    });
    extensionAPI.ui.commandPalette.addCommand({
      label: "Speech-to-Roam: translate to english",
      callback: () => {
        document.getElementsByClassName("speech-record-button")
          ? (unmountComponent(),
            mountComponent({ startRecording: true, translateOnly: true }))
          : mountComponent();
      },
    });

    extensionAPI.ui.commandPalette.addCommand({
      label: "Speech-to-Roam: toggle button in top bar",
      callback: () => {
        let recordingButtonElts = document.getElementsByClassName(
          "speech-record-button"
        );
        recordingButtonElts.length !== 0
          ? unmountComponent()
          : mountComponent();
      },
    });

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

    mountComponent();

    console.log("Extension loaded.");
    //return;
  },
  onunload: () => {
    removeContainer();
    // disconnectObserver();
    console.log("Extension unloaded");
  },
};
